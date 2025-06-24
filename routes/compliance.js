const express = require('express');
const router = express.Router();
const { pool } = require('../config/database-config');
const upload = require('../config/multer');
const { requireAuth } = require('../middleware/auth');

// Compliance Form Submission
router.post('/submit-compliance', requireAuth, upload.array('files'), async (req, res) => {
  const formData = req.body;
  const files = req.files;

  try {
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert licensee information
      const [licenseeResult] = await connection.query(`
        INSERT INTO licensees (
          name, license_no, date_licensed, other_licenses, domiciled_zone,
          zone, street_road, building_name, postal_address, postal_code,
          tel_no, mobile_no, email, web_address, ceo_name_title,
          contact_person_name, contact_mobile, contact_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          date_licensed = VALUES(date_licensed),
          other_licenses = VALUES(other_licenses),
          domiciled_zone = VALUES(domiciled_zone),
          zone = VALUES(zone),
          street_road = VALUES(street_road),
          building_name = VALUES(building_name),
          postal_address = VALUES(postal_address),
          postal_code = VALUES(postal_code),
          tel_no = VALUES(tel_no),
          mobile_no = VALUES(mobile_no),
          email = VALUES(email),
          web_address = VALUES(web_address),
          ceo_name_title = VALUES(ceo_name_title),
          contact_person_name = VALUES(contact_person_name),
          contact_mobile = VALUES(contact_mobile),
          contact_email = VALUES(contact_email)
      `, [
        formData.licenseeName,
        formData.licenseNo,
        formData.dateLicensed,
        formData.otherLicenses,
        formData.domiciledZone,
        formData.zone,
        formData.streetRoad,
        formData.buildingName,
        formData.postalAddress,
        formData.postalCode,
        formData.telNo,
        formData.mobileNo,
        formData.emailAddress,
        formData.webAddress,
        formData.ceoNameTitle,
        formData.contactPersonName,
        formData.contactMobile,
        formData.contactEmail
      ]);

      const licenseeId = licenseeResult.insertId || licenseeResult.updateId;

      // Insert main compliance form
      const [formResult] = await connection.query(`
        INSERT INTO compliance_forms (
          licensee_id, user_id, financial_quarter,
          reporting_period_start, reporting_period_end,
          fiscal_year_start, fiscal_year_end,
          capex_preceding, capex_current, capex_cumulative,
          opex_preceding, opex_current, opex_cumulative,
          total_local_cumulative, total_expat_cumulative,
          total_local_new, total_expat_new,
          total_local_total, total_expat_total,
          exports_subtotal, domestic_sales_subtotal,
          quarterly_turnover, imports_subtotal,
          local_purchases_subtotal, total_inputs,
          esg_initiatives, waste_management,
          comments_suggestions,
          submission_name, submission_title, submission_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        licenseeId,
        req.session.user.id,
        formData.financialQuarter,
        formData.fiscalYearStartDate,
        formData.fiscalYearEndDate,
        formData.fiscalYearStartDate,
        formData.fiscalYearEndDate,
        formData.investment?.capex?.preceding || 0,
        formData.investment?.capex?.current || 0,
        formData.investment?.capex?.cumulative || 0,
        formData.investment?.opex?.preceding || 0,
        formData.investment?.opex?.current || 0,
        formData.investment?.opex?.cumulative || 0,
        formData.employment?.total?.local_cumulative || 0,
        formData.employment?.total?.expat_cumulative || 0,
        formData.employment?.total?.local_new || 0,
        formData.employment?.total?.expat_new || 0,
        formData.employment?.total?.local_total || 0,
        formData.employment?.total?.expat_total || 0,
        formData.exportsSubtotal || 0,
        formData.domesticSalesSubtotal || 0,
        formData.quarterlyTurnover || 0,
        formData.importsSubtotal || 0,
        formData.localPurchasesSubtotal || 0,
        formData.totalInputs || 0,
        formData.esgInitiatives,
        formData.wasteManagement,
        formData.commentsSuggestions,
        formData.submissionName,
        formData.submissionTitle,
        formData.submissionDate
      ]);

      const formId = formResult.insertId;

      // Insert related data using helper functions
      await insertRelatedData(connection, formId, formData, files, req.session.user.id);

      // Commit the transaction
      await connection.commit();
      
      res.json({ 
        message: 'Compliance form submitted successfully',
        formId: formId
      });
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to insert related data
async function insertRelatedData(connection, formId, formData, files, userId) {
  // Insert goods and services
  if (formData.goodsServices) {
    const goodsServicesValues = formData.goodsServices.map(item => [
      formId,
      item.provided,
      item.description,
      item.unitMeasure
    ]);

    if (goodsServicesValues.length > 0) {
      await connection.query(
        'INSERT INTO goods_services (form_id, goods_services_provided, description, unit_measure) VALUES ?',
        [goodsServicesValues]
      );
    }
  }

  // Insert employment details
  const employmentCategories = ['technical', 'non_technical'];
  const employmentTypes = ['permanent', 'term', 'casual'];

  for (const category of employmentCategories) {
    for (const type of employmentTypes) {
      if (formData.employment?.[category]?.[type]) {
        await connection.query(`
          INSERT INTO employment_details (
            form_id, category, type,
            local_cumulative, expat_cumulative,
            local_new, expat_new,
            local_total, expat_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          formId,
          category,
          type,
          formData.employment[category][type].local_cumulative || 0,
          formData.employment[category][type].expat_cumulative || 0,
          formData.employment[category][type].local_new || 0,
          formData.employment[category][type].expat_new || 0,
          formData.employment[category][type].local_total || 0,
          formData.employment[category][type].expat_total || 0
        ]);
      }
    }
  }

  // Insert other related data (exports, domestic sales, imports, etc.)
  await insertArrayData(connection, formId, 'exports', formData.exports);
  await insertArrayData(connection, formId, 'domestic_sales', formData.domesticSales);
  await insertArrayData(connection, formId, 'imports', formData.imports);
  await insertArrayData(connection, formId, 'local_purchases', formData.localPurchases);
  
  // Insert compliance and infrastructure checklists
  await insertChecklistData(connection, formId, formData);
  
  // Insert investors, utilities, and file uploads
  await insertInvestorsData(connection, formId, formData.shareholding);
  await insertUtilitiesData(connection, formId, formData.utilities);
  await insertFileUploads(connection, formId, files, userId);
}

// Helper function for inserting array-based data
async function insertArrayData(connection, formId, tableName, dataArray) {
  if (!dataArray || dataArray.length === 0) return;

  const values = dataArray.map(item => [
    formId,
    item.goods,
    item.units,
    item.price,
    item.total
  ]);

  await connection.query(
    `INSERT INTO ${tableName} (form_id, goods_services, units, price, total) VALUES ?`,
    [values]
  );
}

// Helper function for checklist data
async function insertChecklistData(connection, formId, formData) {
  if (formData.compliance) {
    const complianceValues = formData.compliance.map(item => [
      formId,
      item.item,
      item.compliant,
      item.comments
    ]);

    if (complianceValues.length > 0) {
      await connection.query(
        'INSERT INTO compliance_checklist (form_id, item_name, is_compliant, comments) VALUES ?',
        [complianceValues]
      );
    }
  }

  if (formData.infra) {
    const infraValues = formData.infra.map(item => [
      formId,
      item.item,
      item.status,
      item.percentage
    ]);

    if (infraValues.length > 0) {
      await connection.query(
        'INSERT INTO infrastructure_checklist (form_id, item_name, status, completion_percentage) VALUES ?',
        [infraValues]
      );
    }
  }
}

// Helper function for investors data
async function insertInvestorsData(connection, formId, shareholding) {
  if (shareholding) {
    await connection.query(`
      INSERT INTO investors (
        form_id, category,
        cumulative_preceding, onboarded_current, total_current
      ) VALUES 
      (?, 'enterprises', ?, ?, ?),
      (?, 'others', ?, ?, ?)
    `, [
      formId,
      shareholding.enterprises?.cumulative_preceding || 0,
      shareholding.enterprises?.onboarded_current || 0,
      shareholding.enterprises?.total_current || 0,
      formId,
      shareholding.others?.cumulative_preceding || 0,
      shareholding.others?.onboarded_current || 0,
      shareholding.others?.total_current || 0
    ]);
  }
}

// Helper function for utilities data
async function insertUtilitiesData(connection, formId, utilities) {
  if (utilities) {
    const utilityTypes = ['electricity', 'water', 'telecom', 'others_specify'];
    const utilitiesValues = utilityTypes.map(utility => [
      formId,
      utility === 'others_specify' ? 'other' : utility,
      utilities[`${utility}_name`] || utility,
      utilities[utility]?.units || 0,
      utilities[utility]?.cost || 0,
      utilities[utility]?.total || 0
    ]);

    await connection.query(
      'INSERT INTO utilities (form_id, utility_type, utility_name, units_consumed, cost_per_unit, total_cost) VALUES ?',
      [utilitiesValues]
    );
  }
}

// Helper function for file uploads
async function insertFileUploads(connection, formId, files, userId) {
  if (files && files.length > 0) {
    const fileValues = files.map(file => [
      formId,
      file.fieldname === 'shareholdingCertificate' ? 'shareholding_certificate' :
      file.fieldname === 'auditedAccounts' ? 'audited_accounts' :
      file.fieldname === 'signatureFile' ? 'signature' :
      file.fieldname === 'companyStampFile' ? 'company_stamp' : 'other',
      file.originalname,
      file.path,
      file.size,
      file.mimetype,
      userId
    ]);

    if (fileValues.length > 0) {
      await connection.query(
        `INSERT INTO uploads (
          form_id, file_type, file_name, file_path, 
          file_size, mime_type, uploaded_by
        ) VALUES ?`,
        [fileValues]
      );
    }
  }
}

// Get user's own submissions
router.get('/my-submissions', requireAuth, async (req, res) => {
  try {
    const [submissions] = await pool.query(`
      SELECT 
        cf.*,
        GROUP_CONCAT(up.file_name) as files
      FROM compliance_forms cf
      LEFT JOIN uploads up ON cf.id = up.form_id
      WHERE cf.user_id = ?
      GROUP BY cf.id
      ORDER BY cf.created_at DESC
    `, [req.session.user.id]);

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch submission status by ID
router.get('/submission-status/:submissionId', async (req, res) => {
  const { submissionId } = req.params;

  try {
    const [submission] = await pool.query(
      'SELECT status, checked_by, verified_by, review_date FROM compliance_forms WHERE id = ?',
      [submissionId]
    );

    if (submission.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission[0]);
  } catch (error) {
    console.error('Error fetching submission status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
