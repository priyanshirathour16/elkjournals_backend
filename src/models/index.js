const sequelize = require('../config/database');
const Admin = require('./Admin');
const Author = require('./Author');
const EditorApplication = require('./EditorApplication');
const Journal = require('./Journal');
const EditorialBoard = require('./EditorialBoard');
const JournalIssue = require('./JournalIssue');
const JournalCategory = require('./JournalCategory');
const JournalImpactFactor = require('./JournalImpactFactor');
const Manuscript = require('./Manuscript');
const ManuscriptAuthor = require('./ManuscriptAuthor');
const ContactUs = require('./ContactUs');
const OTP = require('./OTP');
const SubmissionChecklist = require('./SubmissionChecklist');
const Publication = require('./Publication');
const Conference = require('./Conference');
const ConferenceTemplate = require('./ConferenceTemplate');
const CopyrightTemplate = require('./CopyrightTemplate');
const CopyrightSubmission = require('./CopyrightSubmission');
const News = require('./News');
const AbstractSubmission = require('./AbstractSubmission');
const AbstractAssignment = require('./AbstractAssignment');
const AbstractReview = require('./AbstractReview');
const AbstractStatusHistory = require('./AbstractStatusHistory');
const FullPaperFile = require('./FullPaperFile');
const EditorConference = require('./EditorConference');
const ProposalRequest = require('./ProposalRequest');

// Associations
Journal.hasMany(EditorialBoard, { foreignKey: 'journal_id', as: 'editorial_board' });
EditorialBoard.belongsTo(Journal, { foreignKey: 'journal_id', as: 'journal' });
Journal.belongsTo(JournalCategory, { foreignKey: 'category_id', as: 'category' });

JournalCategory.hasMany(Journal, { foreignKey: 'category_id', as: 'journals' });
EditorApplication.belongsTo(Journal, { foreignKey: 'journal_id', as: 'journalData' });
Journal.hasMany(EditorApplication, { foreignKey: 'journal_id', as: 'editorApplications' });

Journal.hasMany(JournalImpactFactor, { foreignKey: 'journal_id', as: 'impact_factors' });
JournalImpactFactor.belongsTo(Journal, { foreignKey: 'journal_id', as: 'journal' });

Journal.hasMany(Manuscript, { foreignKey: 'journal_id', as: 'manuscripts' });
Manuscript.belongsTo(Journal, { foreignKey: 'journal_id', as: 'journal' });

Manuscript.hasMany(ManuscriptAuthor, { foreignKey: 'manuscript_id', as: 'authors', onDelete: 'CASCADE' });
ManuscriptAuthor.belongsTo(Manuscript, { foreignKey: 'manuscript_id', as: 'manuscript' });

Author.hasMany(Manuscript, { foreignKey: 'author_id', as: 'manuscripts' });
Manuscript.belongsTo(Author, { foreignKey: 'author_id', as: 'author' });

Manuscript.hasOne(SubmissionChecklist, { foreignKey: 'manuscript_id', as: 'checklist', onDelete: 'CASCADE' });
SubmissionChecklist.belongsTo(Manuscript, { foreignKey: 'manuscript_id', as: 'manuscript' });

// Publication Associations
Journal.hasMany(Publication, { foreignKey: 'journal_id', as: 'publications' });
Publication.belongsTo(Journal, { foreignKey: 'journal_id', as: 'journal' });

JournalIssue.hasMany(Publication, { foreignKey: 'issue_id', as: 'publications' });
Publication.belongsTo(JournalIssue, { foreignKey: 'issue_id', as: 'issue' });

// JournalIssue associations are defined in the JournalIssue model file

// Conference Associations
Conference.hasOne(ConferenceTemplate, { foreignKey: 'conference_id', as: 'template', onDelete: 'CASCADE' });
ConferenceTemplate.belongsTo(Conference, { foreignKey: 'conference_id', as: 'conference' });

// Copyright Associations
CopyrightTemplate.hasMany(CopyrightSubmission, { foreignKey: 'template_id', as: 'submissions' });
CopyrightSubmission.belongsTo(CopyrightTemplate, { foreignKey: 'template_id', as: 'template' });

// Abstract Submission Associations
Conference.hasMany(AbstractSubmission, { foreignKey: 'conference_id', as: 'abstract_submissions' });
AbstractSubmission.belongsTo(Conference, { foreignKey: 'conference_id', as: 'conference' });

Author.hasMany(AbstractSubmission, { foreignKey: 'author_id', as: 'abstract_submissions' });
AbstractSubmission.belongsTo(Author, { foreignKey: 'author_id', as: 'author' });

// Abstract Assignment Associations
AbstractSubmission.hasMany(AbstractAssignment, { foreignKey: 'abstract_id', as: 'assignments' });
AbstractAssignment.belongsTo(AbstractSubmission, { foreignKey: 'abstract_id', as: 'abstract' });
AbstractAssignment.belongsTo(EditorApplication, { foreignKey: 'editor_id', as: 'editor' });
AbstractAssignment.belongsTo(Admin, { foreignKey: 'assigned_by', as: 'assignedByAdmin' });

// Abstract Review Associations
AbstractSubmission.hasMany(AbstractReview, { foreignKey: 'abstract_id', as: 'reviews' });
AbstractReview.belongsTo(AbstractSubmission, { foreignKey: 'abstract_id', as: 'abstract' });
AbstractReview.belongsTo(AbstractAssignment, { foreignKey: 'assignment_id', as: 'assignment' });

// Abstract Status History Associations
AbstractSubmission.hasMany(AbstractStatusHistory, { foreignKey: 'abstract_id', as: 'statusHistory' });
AbstractStatusHistory.belongsTo(AbstractSubmission, { foreignKey: 'abstract_id', as: 'abstract' });

// Full Paper File Associations
AbstractSubmission.hasMany(FullPaperFile, { foreignKey: 'abstract_id', as: 'full_paper_files' });
FullPaperFile.belongsTo(AbstractSubmission, { foreignKey: 'abstract_id', as: 'abstract' });
FullPaperFile.belongsTo(Author, { foreignKey: 'uploaded_by', as: 'uploader' });

// Editor Conference Associations
EditorConference.belongsTo(EditorApplication, { foreignKey: 'editor_id', as: 'editor' });
EditorConference.belongsTo(Conference, { foreignKey: 'conference_id', as: 'conference' });
EditorApplication.hasMany(EditorConference, { foreignKey: 'editor_id', as: 'editorConferences' });
Conference.hasMany(EditorConference, { foreignKey: 'conference_id', as: 'editorConferences' });

const db = {
    sequelize,
    Admin,
    Author,
    EditorApplication,
    Journal,
    EditorialBoard,
    JournalIssue,
    JournalCategory,
    JournalImpactFactor,
    Manuscript,
    ManuscriptAuthor,
    ContactUs,
    OTP,
    SubmissionChecklist,
    SubmissionChecklist, // Duplicate key in original, intentional or typo? Leaving as is to avoid breaking if referenced.
    Publication,
    Conference,
    ConferenceTemplate,
    CopyrightTemplate,
    CopyrightTemplate, // Duplicate key
    CopyrightSubmission,
    News,
    ConferenceRegistration: require('./ConferenceRegistration'),
    AbstractSubmission,
    AbstractAssignment,
    AbstractReview,
    AbstractStatusHistory,
    FullPaperFile,
    EditorConference,
    ProposalRequest
};

module.exports = db;

