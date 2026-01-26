const copyrightRepository = require("../repositories/CopyrightRepository");
const manuscriptRepository = require("../repositories/ManuscriptRepository");
const { sequelize } = require("../models");

class CopyrightService {
  /**
   * Get the currently active copyright template
   */
  async getActiveTemplate() {
    const template = await copyrightRepository.findActiveTemplate();

    if (!template) {
      throw new Error("No active copyright template found");
    }

    return {
      id: template.id,
      version: template.version,
      schema: template.schema,
      createdAt: template.createdAt,
    };
  }

  /**
   * Submit copyright agreement for a manuscript
   * @param {string} manuscriptId - The public UUID of the manuscript
   * @param {string} templateVersion - The version of the template being signed
   * @param {object} signatures - The signatures data { "0": { "name": "...", "date": "..." }, ... }
   */
  async submitCopyright(manuscriptId, templateVersion, signatures) {
    // Validate manuscript exists
    const manuscript = await manuscriptRepository.findByPublicId(manuscriptId);
    if (!manuscript) {
      throw new Error("Manuscript not found");
    }

    // Validate template version exists
    const template =
      await copyrightRepository.findTemplateByVersion(templateVersion);
    if (!template) {
      throw new Error(
        `Copyright template version "${templateVersion}" not found`,
      );
    }

    // Check if submission already exists
    const existingSubmission =
      await copyrightRepository.findSubmissionByManuscriptId(manuscriptId);
    if (existingSubmission) {
      throw new Error(
        "Copyright agreement already submitted for this manuscript",
      );
    }

    // Create submission and mark manuscript as Accepted in a single transaction
    const result = await sequelize.transaction(async (transaction) => {
      const submission = await copyrightRepository.createSubmission(
        {
          manuscript_id: manuscriptId,
          template_id: template.id,
          submission_data: { signatures },
        },
        transaction,
      );

      const updated = await manuscriptRepository.update(
        manuscriptId,
        { status: "Accepted" },
        transaction,
      );

      if (!updated) {
        throw new Error("Failed to update manuscript status to Accepted");
      }

      return submission;
    });

    return {
      success: true,
      submissionId: result.id,
      manuscriptId,
      templateVersion,
      message: "Copyright agreement submitted successfully",
    };
  }

  /**
   * Get copyright submission for a manuscript with the template used at signing
   * @param {string} manuscriptId - The public UUID of the manuscript
   */
  async getSubmissionByManuscriptId(manuscriptId) {
    const submission =
      await copyrightRepository.findSubmissionByManuscriptId(manuscriptId);

    if (!submission) {
      throw new Error("Copyright submission not found for this manuscript");
    }

    return {
      submission: {
        id: submission.id,
        manuscript_id: submission.manuscript_id,
        submission_data: submission.submission_data,
        createdAt: submission.createdAt,
      },
      template: {
        id: submission.template.id,
        version: submission.template.version,
        schema: submission.template.schema,
      },
    };
  }

  /**
   * Get manuscript with authors for copyright form rendering
   * @param {string} manuscriptId - The public UUID of the manuscript
   */
  async getManuscriptForCopyright(manuscriptId) {
    const manuscript =
      await copyrightRepository.findManuscriptWithAuthors(manuscriptId);

    if (!manuscript) {
      throw new Error("Manuscript not found");
    }

    return {
      id: manuscript.id,
      manuscript_id: manuscript.manuscript_id,
      paper_title: manuscript.paper_title,
      status: manuscript.status,
      journal: manuscript.journal,
      authors: manuscript.authors.map((author) => ({
        id: author.id,
        first_name: author.first_name,
        last_name: author.last_name,
        full_name: `${author.first_name} ${author.last_name}`,
        title: author.designation, // Using designation as title
        designation: author.designation,
        institution: author.institution,
        city: author.city,
        state: author.state,
        country: author.country,
        email: author.email,
        phone: author.phone,
        is_corresponding_author: author.is_corresponding_author,
      })),
    };
  }
}

module.exports = new CopyrightService();
