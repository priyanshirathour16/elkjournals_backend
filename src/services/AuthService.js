const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminRepository = require("../repositories/AdminRepository");
const authorRepository = require("../repositories/AuthorRepository");

const editorApplicationRepository = require("../repositories/EditorApplicationRepository");

const nodemailer = require("nodemailer");
const emailService = require("../utils/emailService");
const { welcomeAuthorTemplate } = require("../utils/emailTemplates");

class AuthService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail", // Default to gmail or use env
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  async login(email, password) {
    console.log("Login attempt for:", email);

    // 1. Check Author Table First
    const author = await authorRepository.findByEmail(email);

    if (author) {
      const isMatch = await bcrypt.compare(password, author.password);
      if (isMatch) {
        const token = jwt.sign(
          {
            id: author.id,
            email: author.email,
            role: "author",
            email_trigger: author.email_trigger,
          },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "24h" },
        );

        // Return minimum required author details
        return {
          token,
          role: "author",
          email_trigger: author.email_trigger,
          user: {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            phone: author.contactNumber || null,
            role: "author",
          },
        };
      }
      // If author exists but password wrong, we technically should fail here
      // to avoid probing, or continue to check admin?
      // Usually if email exists in one table, we expect the password to match there.
      // But let's stick to the prompt: "if not found in this then check for editor"
      // The prompt says "first check author exits if exits ... and if not found in this"
      // It implies if *user* not found. If user found but wrong password, it's invalid creds.
      console.log("Password mismatch for author:", email);
      throw new Error("Invalid credentials");
    }

    // 2. Check Admin Table
    const admin = await adminRepository.findByEmail(email);

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        const token = jwt.sign(
          {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            email_trigger: admin.email_trigger,
          },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "24h" },
        );

        return {
          token,
          role: admin.role, // 'admin' or 'editor'
          email_trigger: admin.email_trigger,
          user: {
            id: admin.id,
            email: admin.email,
            phone: null,
            role: admin.role,
          },
        };
      }
      console.log("Password mismatch for admin:", email);
      throw new Error("Invalid credentials");
    }

    // 3. Check EditorApplication Table
    const editor = await editorApplicationRepository.findByEmail(email);

    if (editor) {
      const isMatch = await bcrypt.compare(password, editor.password);
      if (isMatch) {
        const token = jwt.sign(
          {
            id: editor.id,
            email: editor.email,
            role: "editor",
            email_trigger: editor.email_trigger || false,
          },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "24h" },
        );

        return {
          token,
          role: "editor",
          email_trigger: editor.email_trigger || false,
          user: {
            id: editor.id,
            email: editor.email,
            phone: editor.phone || null,
            role: "editor",
          },
        };
      }
      console.log("Password mismatch for editor:", email);
      throw new Error("Invalid credentials");
    }

    // 4. Not found in any table
    console.log(
      "User not found in Author, Admin, or EditorApplication tables:",
      email,
    );
    throw new Error("Invalid credentials");
  }

  async registerAuthor(authorData) {
    const { email, password, confirmPassword } = authorData;

    // Validation happens in controller/middleware, but double check here
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const existingAuthor = await authorRepository.findByEmail(email);
    if (existingAuthor) {
      throw new Error("Author already exists with this email");
    }

    const existingEditor = await editorApplicationRepository.findByEmail(email);
    if (existingEditor) {
      throw new Error("Email is already registered as an editor");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Remove confirm fields and other non-model fields if necessary,
    // though Sequelize usually ignores extra fields if not defined in model,
    // it's cleaner to prepare the object.
    const newAuthorPayload = {
      ...authorData,
      password: hashedPassword,
    };
    // Remove confirmPassword/confirmEmail to be safe/clean
    delete newAuthorPayload.confirmPassword;
    delete newAuthorPayload.confirmEmail;
    delete newAuthorPayload.captchaInput; // Not storing captcha

    const newAuthor = await authorRepository.create(newAuthorPayload);

    // Send welcome email with credentials (always send on creation)
    try {
      const fullName =
        `${authorData.firstName || "Author"} ${authorData.lastName || ""}`.trim();
      await emailService.sendEmail({
        to: email,
        subject: "Welcome to ELK Journals - Account Created",
        html: welcomeAuthorTemplate({
          name: fullName || "Author",
          email: email,
          tempPassword: password,
        }),
      });
    } catch (emailError) {
      console.warn("⚠️  Welcome email sending failed:", emailError.message);
    }

    // Return without password
    const { password: _, ...authorResponse } = newAuthor.toJSON();
    return authorResponse;
  }

  async sendOtp(name, email, phone) {
    const otp = this.generateOtp();

    // In a real app, store OTP in DB/Redis with expiry.
    // For this implementation, we return it in response as requested.

    // Always send OTP email (no email_trigger check for OTP)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      text: `Hello ${name},\n\nYour OTP for login is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nRegards,\nElk Journals Team`,
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
      } else {
        console.log(`Mocking Email Send. OTP for ${email} is ${otp}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send OTP email");
    }

    return { otp, message: "OTP sent successfully" };
  }

  async verifyOtpLogin(name, email, phone) {
    let author = await authorRepository.findByEmail(email);
    let role = "author";
    let token;
    let isNewUser = false;

    if (!author) {
      // Register new author
      const tempPassword = "Password@123";
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || ".";

      const newAuthorData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        contactNumber: phone,
        role: "author",
      };

      author = await authorRepository.create(newAuthorData);
      isNewUser = true;

      // Send welcome email with credentials for newly created author
      try {
        const fullName = `${firstName} ${lastName}`.trim();
        await emailService.sendEmail({
          to: email,
          subject: "Welcome to ELK Journals - Account Created",
          html: welcomeAuthorTemplate({
            name: fullName || "Author",
            email: email,
            tempPassword: tempPassword,
          }),
        });
      } catch (emailError) {
        console.warn("⚠️  Welcome email sending failed:", emailError.message);
      }
    }

    token = jwt.sign(
      { id: author.id, email: author.email, role: author.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" },
    );

    const authorData = author.toJSON ? author.toJSON() : author;
    delete authorData.password;
    authorData.phone = author.contactNumber || null; // Ensure phone field is present

    return {
      token,
      role: author.role,
      user: authorData,
      isNewUser,
      message: isNewUser
        ? "User registered and logged in successfully"
        : "Login successful",
    };
  }

  async changePassword(userId, role, currentPassword, newPassword) {
    let user;
    let repository;

    // Determine repository based on role
    if (role === "admin") {
      repository = adminRepository;
      user = await repository.findById(userId);
    } else if (role === "author") {
      repository = authorRepository;
      user = await repository.findByIdWithPassword(userId);
    } else if (role === "editor") {
      repository = editorApplicationRepository;
      user = await repository.findById(userId);
    } else {
      throw new Error("Invalid role");
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Current password incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return { message: "Password changed successfully" };
  }

  async verifyUser(email) {
    // 1. Check Author
    const author = await authorRepository.findByEmail(email);
    if (author) {
      return {
        success: true,
        id: author.id,
        email: author.email,
        role: "author",
        message: "User found in Author records",
      };
    }

    // 2. Check Editor
    const editor = await editorApplicationRepository.findByEmail(email);
    if (editor) {
      return {
        success: true,
        id: editor.id,
        email: editor.email,
        role: "editor",
        message: "User found in Editor records",
      };
    }

    throw new Error("User not found in Author or Editor records");
  }

  async resetPassword(email, role, newPassword) {
    let repository;

    if (role === "author") {
      repository = authorRepository;
    } else if (role === "editor") {
      repository = editorApplicationRepository;
    } else {
      throw new Error("Invalid role");
    }

    const user = await repository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { success: true, message: "Password updated successfully" };
  }

  async updateEmailTrigger(role, id, email_trigger) {
    let repository;

    // Determine repository based on role
    if (role === "admin") {
      repository = adminRepository;
    } else if (role === "author") {
      repository = authorRepository;
    } else if (role === "editor") {
      repository = editorApplicationRepository;
    } else {
      throw new Error("Invalid role");
    }

    // Convert email_trigger to boolean (0 or 1 to true or false)
    const emailTriggerValue = Boolean(Number(email_trigger));

    const user = await repository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    // Update email trigger
    user.email_trigger = emailTriggerValue;
    await user.save();

    return {
      success: true,
      message: "Email trigger updated successfully",
      user: {
        id: user.id,
        email: user.email,
        role: role,
        email_trigger: user.email_trigger,
      },
    };
  }
}

module.exports = new AuthService();
