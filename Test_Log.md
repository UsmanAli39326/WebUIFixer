# System Test Log

This file contains the complete, updated test logs from the latest automated suite execution. Every module has been successfully tested for both positive and negative workflows.

## 1. Create Account

| Field | Details |
| :--- | :--- |
| **ID** | TC_CREATE_ACCOUNT_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful user account creation. |
| **Input** | Valid user information (Valid User, valid@example.com) |
| **Expected Result** | User account is created successfully and redirected to login/dashboard |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_CREATE_ACCOUNT_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify invalid account creation handling. |
| **Input** | Invalid input or duplicate email (dup@example.com) |
| **Expected Result** | Error message displayed and account not created |
| **Status** | Tested, Passed |

## 2. User Login

| Field | Details |
| :--- | :--- |
| **ID** | TC_LOGIN_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful user authentication. |
| **Input** | Valid login credentials (login@example.com) |
| **Expected Result** | User successfully enters dashboard |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_LOGIN_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify invalid login handling. |
| **Input** | Invalid email or password (Wrong123) |
| **Expected Result** | Error message displayed and access denied |
| **Status** | Tested, Passed |

## 3. Website Analysis

| Field | Details |
| :--- | :--- |
| **ID** | TC_WEBSITE_ANALYSIS_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful website analysis. |
| **Input** | Valid website URL (https://example.com) |
| **Expected Result** | Analysis report generated successfully |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_WEBSITE_ANALYSIS_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify invalid website analysis handling. |
| **Input** | Invalid or inaccessible URL (missing title trigger) |
| **Expected Result** | Error message displayed |
| **Status** | Tested, Passed |

## 4. Issue Detection and Classification

| Field | Details |
| :--- | :--- |
| **ID** | TC_ISSUE_DETECTION_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful issue detection and classification. |
| **Input** | Website analysis data |
| **Expected Result** | Issues displayed with severity levels |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_ISSUE_DETECTION_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify failure handling during issue detection. |
| **Input** | Incomplete analysis data / Invalid Audit ID |
| **Expected Result** | Error message displayed |
| **Status** | Tested, Passed |

## 5. Recommendation Generation

| Field | Details |
| :--- | :--- |
| **ID** | TC_RECOMMENDATION_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful recommendation generation. |
| **Input** | Detected issue data (Audit ID) |
| **Expected Result** | AI-generated recommendations displayed |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_RECOMMENDATION_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify recommendation generation failure handling. |
| **Input** | Incomplete issue data (Invalid Audit ID) |
| **Expected Result** | Recommendations not generated and error displayed |
| **Status** | Tested, Passed |

## 6. WCAG Compliance Check

| Field | Details |
| :--- | :--- |
| **ID** | TC_WCAG_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful WCAG compliance checking. |
| **Input** | Website analysis data (Completed Audit) |
| **Expected Result** | WCAG score and compliance report displayed |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_WCAG_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify WCAG engine failure handling. |
| **Input** | Website data (Unavailable Engine/Data) |
| **Expected Result** | Compliance report not generated and error displayed |
| **Status** | Tested, Passed |

## 7. Report Generation and Export

| Field | Details |
| :--- | :--- |
| **ID** | TC_REPORT_EXPORT_SUCCESS |
| **Type** | Positive Test Case |
| **Priority** | High |
| **Description** | To verify successful report generation and export. |
| **Input** | Analysis results (Valid Audit ID) |
| **Expected Result** | Report generated and downloaded successfully |
| **Status** | Tested, Passed |

| Field | Details |
| :--- | :--- |
| **ID** | TC_REPORT_EXPORT_FAILURE |
| **Type** | Negative Test Case |
| **Priority** | High |
| **Description** | To verify report generation failure handling. |
| **Input** | Missing analysis data (Invalid Audit ID) |
| **Expected Result** | Report generation fails and error displayed |
| **Status** | Tested, Passed |
