const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EditorApplication = sequelize.define(
  "EditorApplication",
  {
    journal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Journals",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qualification: {
      type: DataTypes.STRING,
    },
    specialization: {
      type: DataTypes.STRING,
    },
    institute: {
      type: DataTypes.STRING,
    },
    cvFile: {
      type: DataTypes.STRING,
      comment: "Path to the uploaded CV/Resume file",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected"]],
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: "Whether the editor is currently active or inactive",
    },
    email_trigger: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    tableName: "editor_applications",
  },
);

module.exports = EditorApplication;
