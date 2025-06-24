const express = require('express');
const router = express.Router();
const { pool } = require('../config/database-config');

//TEST
router.post('/licensees', async (req, res) => {
  const formData = req.body;
  // return res.json({ message: 'Licensee submitted', formData });

  // Validate request body
  if (!formData || !formData.licenseeName || !formData.licenseNo) {
    return res.status(400).json({ error: 'Invalid request body. Missing required fields.' });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO licensees (
        name, license_no, date_licensed, other_licenses, domiciled_zone,
        zone, street_road, building_name, postal_address, postal_code,
        tel_no, mobile_no, email, web_address, ceo_name_title,
        contact_person_name, contact_mobile, contact_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)     
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

    const id = result.insertId || result.updateId;
    res.json({ message: 'Licensee submitted', id });
  } catch (error) {
    res.status(500).json({ details: error.message });
  }
});
//END TEST

module.exports = router;
