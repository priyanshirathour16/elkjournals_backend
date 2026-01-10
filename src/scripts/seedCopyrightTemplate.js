/**
 * Seed script for Copyright Template Version 1.0
 * Run: node src/scripts/seedCopyrightTemplate.js
 */

const db = require('../models');
const CopyrightRepository = require('../repositories/CopyrightRepository');

const DEFAULT_TEMPLATE_SCHEMA = {
    title: "Copyright Agreement Form",
    version: "1.0",
    sections: [
        {
            id: "header",
            type: "static_html",
            content: "<div class='text-center uppercase font-bold underline text-2xl mb-8'>Agreement in Relation to Copyright and Originality</div>"
        },
        {
            id: "manuscript_info",
            type: "key_value_grid",
            fields: [
                { label: "Title of the Manuscript", key: "paper_title", italic: true },
                { label: "Author(s)", key: "authors_formatted", italic: true },
                { label: "To be published in the Journal", key: "journal.title", boldValue: true, highlight: true }
            ]
        },
        {
            id: "legal_text",
            type: "static_html",
            content: `<h2 class="font-bold text-lg mb-4">Assignment of Publishing Rights</h2>
<p class="mb-4">The undersigned author(s) hereby assign(s) to the Publisher (ELK Journals) the copyright in the above-identified manuscript, including any supplemental data, tables, figures, and all other materials related thereto, for the full term of copyright and any renewals and extensions thereof.</p>

<p class="mb-4">The author(s) warrant(s) that:</p>
<ul class="list-disc ml-6 mb-4">
    <li>The manuscript is original and has not been published elsewhere, in whole or in part.</li>
    <li>The manuscript is not currently under consideration for publication elsewhere.</li>
    <li>All authors have read and approved the final version of the manuscript.</li>
    <li>All persons entitled to authorship have been so included.</li>
    <li>Proper acknowledgement has been given to all contributors who do not meet the criteria for authorship.</li>
    <li>The manuscript does not contain any unlawful statements and does not infringe on the rights of others.</li>
</ul>

<p class="mb-4">The author(s) agree(s) that:</p>
<ul class="list-disc ml-6 mb-4">
    <li>The Publisher shall have the exclusive right to publish, reproduce, distribute, and license the manuscript in all forms and media.</li>
    <li>The author(s) shall not publish or authorize publication of the manuscript or any substantial portion thereof elsewhere without the Publisher's prior written consent.</li>
    <li>The author(s) grant(s) the Publisher the right to use their name(s), likeness(es), and biographical information in connection with the publication and marketing of the manuscript.</li>
</ul>`
        },
        {
            id: "confirmation_table",
            type: "signature_grid",
            title: "Agreement Confirmation",
            authorCount: 3
        },
        {
            id: "author_details",
            type: "dynamic_table",
            title: "Author Details",
            columns: [
                { header: "Field", type: "label", width: "200px" },
                { header: "{ordinal} Author", type: "value" }
            ],
            rows: [
                { label: "Corresponding Author", key: "is_corresponding_author", type: "boolean" },
                { label: "Full Name", key: "full_name", bold: true },
                { label: "Title/Designation", key: "designation" },
                { label: "Institution", key: "institution" },
                { label: "City", key: "city" },
                { label: "State", key: "state" },
                { label: "Country", key: "country" },
                { label: "Email Id", key: "email", isLink: true },
                { label: "Phone", key: "phone" }
            ]
        },
        {
            id: "detailed_signatures",
            type: "signature_grid",
            title: "Detailed Signatures",
            detailed: true,
            authorCount: 3
        }
    ]
};

async function seedCopyrightTemplate() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Database connected.');

        // Sync the new tables
        console.log('Syncing copyright tables...');
        await db.CopyrightTemplate.sync();
        await db.CopyrightSubmission.sync();
        console.log('Tables synced.');

        // Check if Version 1.0 already exists
        const existingTemplate = await CopyrightRepository.findTemplateByVersion('1.0');

        if (existingTemplate) {
            console.log('Version 1.0 template already exists.');
            console.log('Template ID:', existingTemplate.id);
            console.log('Is Active:', existingTemplate.is_active);

            // Optionally update to make it active if not already
            if (!existingTemplate.is_active) {
                await db.sequelize.transaction(async (t) => {
                    await CopyrightRepository.deactivateAllTemplates(t);
                    await CopyrightRepository.updateTemplate(existingTemplate.id, { is_active: true }, t);
                });
                console.log('Template set as active.');
            }
        } else {
            // Create new template (deactivate all existing first)
            await db.sequelize.transaction(async (t) => {
                await CopyrightRepository.deactivateAllTemplates(t);

                const newTemplate = await CopyrightRepository.createTemplate({
                    version: '1.0',
                    is_active: true,
                    schema: DEFAULT_TEMPLATE_SCHEMA
                }, t);

                console.log('Version 1.0 template created successfully!');
                console.log('Template ID:', newTemplate.id);
            });
        }

        console.log('\nSeed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seedCopyrightTemplate();
