// Test data fixtures
const testUsers = {
  validUser: {
    username: 'testuser',
    password: 'password123',
    role: 'user'
  },
  adminUser: {
    username: 'admin',
    password: 'adminpass',
    role: 'admin'
  },
  invalidUser: {
    username: 'invaliduser',
    password: 'wrongpass',
    role: 'user'
  }
};

const testLicensee = {
  licenseeName: 'Test Company Ltd',
  licenseNo: 'TC001',
  dateLicensed: '2024-01-01',
  otherLicenses: 'None',
  domiciledZone: 'Zone A',
  zone: 'Commercial Zone',
  streetRoad: '123 Test Street',
  buildingName: 'Test Building',
  postalAddress: 'P.O. Box 123',
  postalCode: '12345',
  telNo: '555-0123',
  mobileNo: '555-0124',
  emailAddress: 'test@company.com',
  webAddress: 'www.testcompany.com',
  ceoNameTitle: 'John Doe - CEO',
  contactPersonName: 'Jane Smith',
  contactMobile: '555-0125',
  contactEmail: 'jane@company.com'
};

const testComplianceForm = {
  financialQuarter: 'Q1 2024',
  fiscalYearStartDate: '2024-01-01',
  fiscalYearEndDate: '2024-12-31',
  investment: {
    capex: {
      preceding: 50000,
      current: 75000,
      cumulative: 125000
    },
    opex: {
      preceding: 30000,
      current: 45000,
      cumulative: 75000
    }
  },
  employment: {
    total: {
      local_cumulative: 50,
      expat_cumulative: 10,
      local_new: 5,
      expat_new: 2,
      local_total: 55,
      expat_total: 12
    }
  },
  exportsSubtotal: 100000,
  domesticSalesSubtotal: 50000,
  quarterlyTurnover: 150000,
  importsSubtotal: 25000,
  localPurchasesSubtotal: 30000,
  totalInputs: 55000,
  esgInitiatives: 'Renewable energy adoption',
  wasteManagement: 'Proper waste segregation and recycling',
  commentsSuggestions: 'All requirements met',
  submissionName: 'John Doe',
  submissionTitle: 'Compliance Officer',
  submissionDate: '2024-06-24'
};

module.exports = {
  testUsers,
  testLicensee,
  testComplianceForm
};
