Chapter 5 Testing
 
 
	Test Case Specifications 

Test Case for Create Account
Positive Test Case

Field	Details
ID	TC_CREATE_ACCOUNT_SUCCESS
Priority	High
Description	To verify successful user account creation.
Reference	Functional Requirement – Create Account
Users	User
Pre-requisites	A. System is online
	B. User has internet access
	C. User email is not already registered
Steps	A. Open registration page
	B. Enter name, email, and password
	C. Submit registration form
Input	Valid user information
Expected Result	User account is created successfully and redirected to login/dashboard
Status	Tested, Passed

Negative Test Case

Field	Details
ID	TC_CREATE_ACCOUNT_FAILURE
Priority	High
Description	To verify invalid account creation handling.
Reference	Functional Requirement – Create Account
Users	User
Pre-requisites	A. System is online
	B. User has internet access
Steps	A. Open registration page
	B. Enter invalid or existing email
	C. Submit form
Input	Invalid input or duplicate email
Expected Result	Error message displayed and account not created
Status	Tested, Passed

Test Case for User Login
Positive Test Case

Field	Details
ID	TC_LOGIN_SUCCESS
Priority	High
Description	To verify successful user authentication.
Reference	Functional Requirement – User Login
Users	User
Pre-requisites	A. System is online
	B. User has valid login credentials
	C. Internet connection available
Steps	A. Open login page
	B. Enter email and password
	C. Press Login
Input	Valid login credentials
Expected Result	User successfully enters dashboard
Status	Tested, Passed

Negative Test Case

Field	Details
ID	TC_LOGIN_FAILURE
Priority	High
Description	To verify invalid login handling.
Reference	Functional Requirement – User Login
Users	User
Pre-requisites	A. System is online
	B. Internet connection available
Steps	A. Open login page
	B. Enter incorrect credentials
	C. Press Login
Input	Invalid email or password
Expected Result	Error message displayed and access denied
Status	Tested, Passed






Test Case for Website Analysis
Positive Test Case

Field	Details
ID	TC_WEBSITE_ANALYSIS_SUCCESS
Priority	High
Description	To verify successful website analysis.
Reference	Functional Requirement – Website Analysis
Users	User
Pre-requisites	A. System is online
	B. Website URL is accessible
Steps	A. Enter website URL
	B. Submit analysis request
Input	Valid website URL
Expected Result	Analysis report generated successfully
Status	Tested, Passed

Negative Test Case

Field	Details
ID	TC_WEBSITE_ANALYSIS_FAILURE
Priority	High
Description	To verify invalid website analysis handling.
Reference	Functional Requirement – Website Analysis
Users	User
Pre-requisites	A. System is online
Steps	A. Enter invalid URL
	B. Submit analysis request
Input	Invalid or inaccessible URL
Expected Result	Error message displayed
Status	Tested, Passed

Test Case for Issue Detection and Classification
Positive Test Case

Field	Details
ID	TC_ISSUE_DETECTION_SUCCESS
Priority	High
Description	To verify successful issue detection and classification.
Reference	Functional Requirement – Issue Detection
Users	System (AI Engine)
Pre-requisites	A. Website analysis data available
Steps	A. Process website data
	B. Detect issues
	C. Classify issues
Input	Website analysis data
Expected Result	Issues displayed with severity levels
Status	Tested, Passed

Negative Test Case

Field	Details
ID	TC_ISSUE_DETECTION_FAILURE
Priority	High
Description	To verify failure handling during issue detection.
Reference	Functional Requirement – Issue Detection
Users	System (AI Engine)
Pre-requisites	A. Analysis data unavailable
Steps	A. Start issue detection
Input	Incomplete analysis data
Expected Result	Error message displayed
Status	Tested, Passed

Test Case for Recommendation Generation
Positive Test Case

Field	Details
ID	TC_RECOMMENDATION_SUCCESS
Priority	High
Description	To verify successful recommendation generation.
Reference	Functional Requirement – Recommendation Generation
Users	User
Pre-requisites	A. Issues already detected
Steps	A. Request recommendations
	B. Review recommendations
Input	Detected issue data
Expected Result	AI-generated recommendations displayed
Status	Tested, Passed





Negative Test Case

Field	Details
ID	TC_RECOMMENDATION_FAILURE
Priority	High
Description	To verify recommendation generation failure handling.
Reference	Functional Requirement – Recommendation Generation
Users	User
Pre-requisites	A. Insufficient issue data
Steps	A. Request recommendations
Input	Incomplete issue data
Expected Result	Recommendations not generated and error displayed
Status	Tested, Passed

Test Case for WCAG Compliance Check
Positive Test Case

Field	Details
ID	TC_WCAG_SUCCESS
Priority	High
Description	To verify successful WCAG compliance checking.
Reference	Functional Requirement – WCAG Compliance
Users	User
Pre-requisites	A. Website analysis completed
Steps	A. Start WCAG check
	B. Review compliance report
Input	Website analysis data
Expected Result	WCAG score and compliance report displayed
Status	Tested, Passed

Negative Test Case

Field	Details
ID	TC_WCAG_FAILURE
Priority	High
Description	To verify WCAG engine failure handling.
Reference	Functional Requirement – WCAG Compliance
Users	User
Pre-requisites	A. WCAG engine unavailable
Steps	A. Start WCAG check
Input	Website data
Expected Result	Compliance report not generated and error displayed
Status	Tested, Passed

Test Case for Report Generation and Export
Positive Test Case

Field	Details
ID	TC_REPORT_EXPORT_SUCCESS
Priority	High
Description	To verify successful report generation and export.
Reference	Functional Requirement – Report Generation
Users	User
Pre-requisites	A. Analysis completed
	B. User logged in
Steps	A. Request report
	B. Select export format
	C. Download report
Input	Analysis results
Expected Result	Report generated and downloaded successfully
Status	Tested, Passed

Negative Test Case

Field	Details
ID	TC_REPORT_EXPORT_FAILURE
Priority	High
Description	To verify report generation failure handling.
Reference	Functional Requirement – Report Generation
Users	User
Pre-requisites	A. Analysis data unavailable
Steps	A. Request report
Input	Missing analysis data
Expected Result	Report generation fails and error displayed
Status	Tested, Passed

	Black Box Test Cases 
Black Box Testing is a software testing technique where the working, structure and implementation of the system is not revealed to the software tester. The tester only focuses on the inputs and expected outputs of the system according to the functional requirements. This testing method is used for confirming that the system works as expected when the users interact with it and the system responds accordingly.

In the proposed system, AI Driven Website UI Enhancement System, black box testing has been carried out to validate all major functionalities such as user authentication, analysis of website, detection of issues, generation of recommendations, checking website for WCAG validation, report generation, and marketplace integration.

The following types of errors were tested:

Incorrect or missing functions
Interface errors
Errors in accessing the database.
Behavioral / Performance problems
Errors that occur during program startup and shutdown.Start up and end of program errors.

Test Case ID	Module	Test Input	Expected Output	Actual Result	Status
BB_01	Create Account	Valid user information	Account created successfully	Account created successfully	Passed
BB_02	Create Account	Existing email address	Error message displayed	Error message displayed	Passed
BB_03	User Login	Correct email and password	User redirected to dashboard	Dashboard opened successfully	Passed
BB_04	User Login	Incorrect password	Access denied with error message	Error displayed correctly	Passed
BB_05	Website Analysis	Valid website URL	Analysis report generated	Report generated successfully	Passed
BB_06	Website Analysis	Invalid website URL	Error message displayed	Error displayed correctly	Passed
BB_07	Issue Detection	Valid website analysis data	UI/UX issues detected	Issues detected successfully	Passed
BB_08	Recommendation Generation	Detected issues data	AI recommendations generated	Recommendations displayed	Passed
BB_09	Real-Time Preview	Apply suggested changes	Enhanced preview displayed	Preview generated successfully	Passed
BB_10	Real-Time Preview	Invalid preview request	Error message displayed	Error displayed correctly	Passed
BB_11	WCAG Compliance Check	Website analysis data	WCAG score generated	Compliance report displayed	Passed
BB_12	Report Generation	Generate PDF report	Downloadable report created	Report downloaded successfully	Passed
BB_13	Marketplace Integration	Upload design template	Template uploaded successfully	Upload successful	Passed
BB_14	Marketplace Integration	Download selected template	Template downloaded	Download completed successfully	Passed
BB_15	Administrator Dashboard	View logs and reports	Dashboard information displayed	Dashboard loaded correctly	Passed

	Equivalence Partitions (EP) 
Equivalence Partitioning (EP) is a black box testing technique used to reduce the total number of test cases by dividing input data into valid and invalid partitions. Each partition represents a group of inputs that are expected to behave similarly. Testing one value from each partition is considered sufficient to validate the functionality.
For the proposed AI Driven Website UI Enhancement System, equivalence partitioning was applied to major modules such as login authentication, website analysis, account creation, and report generation.

Equivalence Partition for Login Authentication

Variables	Valid Classes	Invalid Classes
Username / Email	1. Registered email address. 2. Correct email format. 3. Compulsory field.	1. Unregistered email address. 2. Invalid email format. 3. Empty field.
Password	1. Length greater than 5 characters. 2. Contains alphabets, digits, or symbols.	1. Length less than 5 characters. 2. Incorrect password. 3. Empty field.

Equivalence Partition for Create Account

Variables	Valid Classes	Invalid Classes
Full Name	1. Alphabetic characters allowed. 2. Minimum 3 characters.	1. Numeric-only name. 2. Empty field.
Email Address	1. Valid email format. 2. Unique email address.	1. Invalid email format. 2. Existing email address.
Password	1. Strong password with minimum 6 characters.	1. Weak password. 2. Empty field.



Equivalence Partition for Website Analysis

Variables	Valid Classes	Invalid Classes
Website URL	1. Valid and accessible URL. 2. HTTPS supported URL.	1. Invalid URL format. 2. Inaccessible website. 3. Empty field.
Analysis Request	1. Website contains readable UI elements.	1. Unsupported website structure.

Equivalence Partition for WCAG Compliance Check

Variables	Valid Classes	Invalid Classes
Website Data	1. Complete analysis data available.	1. Incomplete data. 2. Missing UI elements.
WCAG Rules Engine	1. WCAG service available.	1. WCAG engine unavailable.

Equivalence Partition for Report Generation

Variables	Valid Classes	Invalid Classes
Report Type	1. PDF format selected. 2. Valid report data available.	1. Unsupported format. 2. Missing analysis data.
Download Request	1. Authorized user request.	1. Unauthorized access request.

	Boundary Value Analysis 

Boundary Value Analysis (BVA) is a black box testing technique used to test values at the boundaries of input domains. It focuses on testing the minimum, maximum, just below, and just above boundary values because errors are more likely to occur at these points.
In the AI Driven Website UI Enhancement System, boundary value analysis was applied to important input fields such as password length, username length, URL input, report generation limits, and file uploads.

Boundary Value Analysis for Login Authentication

Variable	Minimum Value	Maximum Value	Valid Boundary Values	Invalid Boundary Values
Password Length	6 characters	20 characters	6, 7, 19, 20	5, 21
Email Length	5 characters	50 characters	5, 6, 49, 50	4, 51

Boundary Value Analysis for Create Account

Variable	Minimum Value	Maximum Value	Valid Boundary Values	Invalid Boundary Values
Full Name Length	3 characters	30 characters	3, 4, 29, 30	2, 31
Password Length	6 characters	20 characters	6, 7, 19, 20	5, 21

Boundary Value Analysis for Website Analysis

Variable	Minimum Value	Maximum Value	Valid Boundary Values	Invalid Boundary Values
Website URL Length	10 characters	200 characters	10, 11, 199, 200	9, 201
Website Scan Time	1 second	300 seconds	1, 2, 299, 300	0, 301

Boundary Value Analysis for Report Generation

Variable	Minimum Value	Maximum Value	Valid Boundary Values	Invalid Boundary Values
Report File Size	1 KB	10 MB	1 KB, 2 KB, 9.9 MB, 10 MB	0 KB, 10.1 MB
Report Name Length	3 characters	50 characters	3, 4, 49, 50	2, 51

Boundary Value Analysis for Marketplace Upload

Variable	Minimum Value	Maximum Value	Valid Boundary Values	Invalid Boundary Values
Template File Size	1 KB	25 MB	1 KB, 2 KB, 24.9 MB, 25 MB	0 KB, 25.1 MB
Template Title Length	3 characters	40 characters	3, 4, 39, 40	2, 41

	Decision Table Testing 

Decision Table Testing is a black box testing technique used to verify system behavior for different combinations of inputs and conditions. It ensures that every possible decision path and action in the system is tested at least once. This method is especially useful for validating business rules, authentication logic, and conditional workflows.
In the AI Driven Website UI Enhancement System, decision table testing was applied to important modules such as login authentication, account creation, website analysis, and report generation.

Decision Table for User Login

Conditions / Rules	Rule 1	Rule 2	Rule 3	Rule 4
Valid Email	Yes	Yes	No	No
Valid Password	Yes	No	Yes	No
Internet Connection Available	Yes	Yes	Yes	Yes
Actions				
Login Successful	Yes	No	No	No
Error Message Displayed	No	Yes	Yes	Yes

Decision Table for Create Account

Conditions / Rules	Rule 1	Rule 2	Rule 3	Rule 4
Valid Name	Yes	Yes	No	Yes
Unique Email	Yes	No	Yes	Yes
Strong Password	Yes	Yes	Yes	No
Actions				
Account Created	Yes	No	No	No
Error Message Displayed	No	Yes	Yes	Yes

Decision Table for Website Analysis

Conditions / Rules	Rule 1	Rule 2	Rule 3	Rule 4
Valid Website URL	Yes	No	Yes	No
Website Accessible	Yes	Yes	No	No
Analysis Requested	Yes	Yes	Yes	Yes
Actions				
Analysis Report Generated	Yes	No	No	No
Error Message Displayed	No	Yes	Yes	Yes

Decision Table for WCAG Compliance Check

Conditions / Rules	Rule 1	Rule 2	Rule 3
Analysis Data Available	Yes	No	Yes
WCAG Engine Available	Yes	Yes	No
Actions			
Compliance Report Generated	Yes	No	No
Error Message Displayed	No	Yes	Yes

Decision Table for Report Generation

Conditions / Rules	Rule 1	Rule 2	Rule 3
User Logged In	Yes	No	Yes
Analysis Completed	Yes	Yes	No
Actions			
Report Generated	Yes	No	No
Error Message Displayed	No	Yes	Yes

	State transition Testing 

State Transition Testing for User Login

Current State	Input / Event	Next State	Expected Result
Logged Out	Enter valid credentials	Logged In	User dashboard opens
Logged Out	Enter invalid credentials	Login Failed	Error message displayed
Login Failed	Retry valid credentials	Logged In	Login successful
Logged In	Logout request	Logged Out	Session terminated
Logged In	Session timeout	Logged Out	User redirected to login page

State Transition Testing for Website Analysis

Current State	Input / Event	Next State	Expected Result
Idle	Enter valid website URL	Processing	Analysis started
Processing	Analysis completed	Report Generated	Analysis report displayed
Processing	Invalid website detected	Error State	Error message displayed
Error State	Re-enter valid URL	Processing	Analysis restarted

State Transition Testing for Recommendation Generation

Current State	Input / Event	Next State	Expected Result
Issues Detected	Generate recommendations	Recommendation Ready	Suggestions displayed
Issues Detected	Insufficient data	Failed State	Recommendation error shown
Recommendation Ready	Apply changes	Preview Mode	Updated UI preview displayed
Preview Mode	Reject changes	Original Layout	Changes discarded



State Transition Testing for WCAG Compliance Check

Current State	Input / Event	Next State	Expected Result
Analysis Completed	Start WCAG check	Compliance Checking	WCAG validation started
Compliance Checking	Rules validated	Compliance Report Generated	WCAG report displayed
Compliance Checking	WCAG engine unavailable	Error State	Error displayed

State Transition Testing for Report Generation

Current State	Input / Event	Next State	Expected Result
Analysis Completed	Generate report request	Report Processing	Report creation started
Report Processing	Report generated successfully	Download Ready	Download option available
Report Processing	Generation failed	Error State	Error message displayed
Download Ready	Download report	Report Downloaded	File downloaded successfully

State Transition Testing for Marketplace Integration

Current State	Input / Event	Next State	Expected Result
Marketplace Open	Upload template	Upload Processing	Template verification started
Upload Processing	Upload successful	Template Published	Template visible in marketplace
Upload Processing	Upload failed	Error State	Upload error displayed
Template Published	Download request	Download Completed	Template downloaded successfully

	Use Case Testing 

Use Case Testing for Create Account

Use Case ID	UC_01
Use Case Name	Create Account
Actor	User
Description	Verify successful user registration workflow
Preconditions	Internet connection available
Test Steps	1. Open registration page 
2. Enter valid name, email, and password 
3. Submit registration form
Expected Result	User account created successfully
Actual Result	Account created and confirmation displayed
Status	Passed

Use Case Testing for User Login

Use Case ID	UC_02
Use Case Name	User Login
Actor	User
Description	Verify login functionality using valid credentials
Preconditions	User account already exists
Test Steps	1. Open login page 
2. Enter valid credentials 
3. Press login button
Expected Result	User redirected to dashboard
Actual Result	Dashboard opened successfully
Status	Passed

Use Case Testing for Website Analysis

Use Case ID	UC_04
Use Case Name	Website Analysis
Actor	User
Description	Verify website analysis workflow
Preconditions	Website URL accessible
Test Steps	1. Enter website URL 
2. Submit analysis request 
3. Wait for processing
Expected Result	Analysis report generated successfully
Actual Result	Report displayed successfully
Status	Passed

Use Case Testing for Issue Detection and Classification

Use Case ID	UC_05
Use Case Name	Issue Detection and Classification
Actor	AI Engine
Description	Verify issue detection process
Preconditions	Website analysis data available
Test Steps	1. Process extracted website data 
2. Detect UI/UX issues 
3. Classify issues
Expected Result	Categorized issue list displayed
Actual Result	Issues displayed with severity levels
Status	Passed

Use Case Testing for Recommendation Generation

Use Case ID	UC_06
Use Case Name	Recommendation Generation
Actor	AI Engine / User
Description	Verify AI recommendation generation
Preconditions	Issues already detected
Test Steps	1. Generate recommendations 
2. Display recommendations to user
Expected Result	Improvement suggestions generated successfully
Actual Result	Recommendations displayed correctly
Status	Passed

Use Case Testing for Real-Time Preview

Use Case ID	UC_07
Use Case Name	Real-Time Preview
Actor	User
Description	Verify preview generation workflow
Preconditions	Recommendations available
Test Steps	1. Select suggested changes 
2. Generate preview 
3. Review updated layout
Expected Result	Enhanced UI preview displayed
Actual Result	Preview generated successfully
Status	Passed

Use Case Testing for WCAG Compliance Check

Use Case ID	UC_08
Use Case Name	WCAG Compliance Check
Actor	User
Description	Verify WCAG compliance validation
Preconditions	Analysis data available
Test Steps	1. Start compliance check 
2. Generate compliance report
Expected Result	WCAG score displayed successfully
Actual Result	Compliance report generated
Status	Passed

Use Case Testing for Marketplace Integration

Use Case ID	UC_09
Use Case Name	Design Marketplace Integration
Actor	User
Description	Verify marketplace upload and download workflow
Preconditions	User authenticated
Test Steps	1. Browse templates 
2. Upload/download design
Expected Result	Marketplace actions completed successfully
Actual Result	Upload and download successful
Status	Passed

Use Case Testing for Report Generation and Export

Use Case ID	UC_10
Use Case Name	Report Generation and Export
Actor	User
Description	Verify report generation and export process
Preconditions	Analysis completed and user logged in
Test Steps	1. Request report generation 
2. Select export option 
3. Download report
Expected Result	Report generated and downloaded successfully
Actual Result	Report exported successfully
Status	Passed

	White Box Test Cases 

White Box Testing is a method of software testing to analyze the internal structure, logic, code paths, conditions, loops and program flow of the system. This testing method allows the tester to know the internal implementation of the software and to test the correctness of logical processing, decision making and data handling.





Test Case ID	Module	Testing Type	Description	Expected Result	Status
WB_01	User Authentication	Statement Coverage	Verify all authentication statements execute correctly	Successful login/logout execution	Passed
WB_02	Login Validation	Decision Coverage	Verify valid and invalid credential conditions	Correct decision paths executed	Passed
WB_03	Registration Module	Path Coverage	Verify all registration validation paths	User account created or validation error shown	Passed
WB_04	Website Analysis Engine	Loop Testing	Verify website scanning loop processes all UI elements	Complete website analysis performed	Passed
WB_05	Issue Detection Module	Condition Testing	Verify issue severity classification conditions	Issues classified correctly	Passed
WB_06	Recommendation Engine	Branch Testing	Verify recommendation generation branches	Correct recommendations generated	Passed
WB_07	WCAG Compliance Engine	Decision Coverage	Verify accessibility rule validation logic	Compliance score generated correctly	Passed
WB_08	Preview Generation	Path Testing	Verify preview rendering execution flow	Preview displayed successfully	Passed
WB_09	Marketplace Upload	Exception Handling	Verify upload validation and error handling	Invalid uploads rejected properly	Passed
WB_10	Report Generation	Statement Coverage	Verify report generation statements execute correctly	PDF report generated successfully	Passed
WB_11	Database Access Module	Condition Coverage	Verify database retrieval and storage conditions	Data stored and retrieved correctly	Passed
WB_12	Admin Dashboard	Branch Coverage	Verify admin access control paths	Authorized access granted correctly	Passed


	Cyclometric complexity 

Cyclometric Complexity is one of the white box testing metrics to measure the complexity of a software program. It is used to identify independent execution paths of a program module through analysis of control flow graph of the program module. This is a metric used to estimate testing effort, maintainability and risk level of the software.

Cyclometric Complexity formula:

V(G)=E−N+2P

Where:

V(G) = Cyclometric Complexity
E: The number of edges of the control flow graph is equal to the number of number of control flow graph edges.
N = number of nodes of the control flow graph.
P = Number of connected components (exit nodes)

A lower Cyclometric complexity means:

Easier code understanding
Lower maintenance cost
Minimized risk of errors.
Easier software testing

Whereas higher complexity indicates:

Increased testing effort
An increased likelihood of defects.
Hard to maintain and to debug

Cyclometric Complexity Analysis for AI Driven Website UI Enhancement System
The following modules were analyzed for cyclometric complexity:
Module	Number of Decisions	Cyclometric Complexity	Complexity Level
User Login Module	3	4	Low
Create Account Module	4	5	Low
Website Analysis Module	5	6	Moderate
Issue Detection Module	4	5	Low
Recommendation Engine	6	7	Moderate
WCAG Compliance Module	5	6	Moderate
Report Generation Module	3	4	Low
Marketplace Integration Module	4	5	Low
Admin Dashboard Module	5	6	Moderate

Example: Login Module Cyclometric Complexity
Control Flow Conditions
	Check if email field is empty 
	Check if password field is empty 
	Verify credentials 
Formula Calculation
V(G)=Number of Decision Nodes+1
V(G)=3+1=4

Therefore, the Login Module has a Cyclometric Complexity of:
V(G)=3+1=4
This indicates that there are 4 independent execution paths in the login module.

Interpretation of Complexity Values

Complexity Value	Risk Level	Maintainability
1 – 5	Low Risk	Easy to maintain
6 – 10	Moderate Risk	Moderate maintenance
> 10	High Risk	Difficult to maintain

	Performance testing 

Performance Testing is a non-functional technique of software testing to test the responsiveness, speed, scalability, stability and resource utilization of a system under various workloads and operating conditions. It guarantees efficient application operation in normal and high load situations.

In the AI Driven Website UI Enhancement System, performance testing was carried out to ensure the efficiency of the website analysis, the AI recommendation generation, the WCAG compliance checking, the report generation and the functioning of the marketplace.

The main aims of performance testing were:

Track the response time of the system to the measure.
Consider the stability when used by several users
Identify CPU and Memory utilization.Check CPU and Memory utilization.
Verify scalability of the application
Implement smooth generation of reports and the analysis of their UI.

Performance Testing Results

Test Scenario	Expected Result	Actual Result	Status
User Login Response	Response within 3 seconds	2 seconds average	Passed
Website Analysis	Analysis completed within 15 seconds	12 seconds average	Passed
Recommendation Generation	Recommendations generated smoothly	Generated successfully	Passed
WCAG Compliance Check	Compliance report generated quickly	Completed within 8 seconds	Passed
Report Generation	PDF report downloaded successfully	Generated within 5 seconds	Passed
Marketplace Upload	Template uploaded without delay	Upload successful	Passed
Multiple Concurrent Users	System remains stable	Stable under test load	Passed

Resource Utilization Analysis

Resource	Observation
CPU Usage	Moderate during AI analysis
Memory Usage	Stable under normal load
Database Performance	Fast retrieval and storage operations
Network Usage	Efficient API communication
Server Stability	No major downtime observed

	Stress Testing 
Stress Testing Scenarios

Test Scenario	Stress Applied	Expected Result	Actual Result	Status
Multiple User Logins	500 simultaneous login requests	System should remain operational	Minor response delay observed	Passed
Website Analysis Requests	Continuous AI analysis requests	System processes requests without crash	Stable performance maintained	Passed
Report Generation	Bulk PDF generation requests	Reports generated successfully	Delayed but successful processing	Passed
Marketplace Uploads	Multiple concurrent template uploads	Upload service remains available	Upload completed successfully	Passed
Database Access	Heavy simultaneous queries	Database should maintain integrity	Stable database operations	Passed
WCAG Compliance Checks	Continuous validation requests	Compliance engine remains responsive	Stable with moderate delay	Passed

Stress Testing Observations

Parameter	Observation
CPU Usage	Increased significantly during AI analysis
Memory Usage	Stable with controlled allocation
Server Response Time	Increased slightly under heavy load
Database Stability	No corruption or data loss observed
API Performance	Functional with acceptable delay
Recovery Capability	System recovered successfully after overload

Recovery Testing

Recovery testing was performed after stress conditions to ensure that the system could return to normal operation successfully.

Recovery Results

Recovery Scenario	Result
Server overload recovery	Successful
Database reconnection	Successful
API service restoration	Successful
User session recovery	Successful
Report generation restart	Successful

	System Testing 
System Testing Scenarios

Test Case ID	Module	Test Scenario	Expected Result	Actual Result	Status
ST_01	User Registration	Create a new user account	Account created successfully	Account created successfully	Passed
ST_02	User Login	Login with valid credentials	User redirected to dashboard	Dashboard opened successfully	Passed
ST_03	Website Analysis	Analyze accessible website	Analysis report generated	Report generated successfully	Passed
ST_04	Issue Detection	Detect UI/UX issues	Issues identified and classified	Issues displayed correctly	Passed
ST_05	Recommendation Engine	Generate AI recommendations	Recommendations displayed	Recommendations generated successfully	Passed
ST_06	Real-Time Preview	Apply suggested changes	Enhanced preview displayed	Preview generated correctly	Passed
ST_07	WCAG Compliance Check	Validate website accessibility	Compliance report generated	WCAG score displayed	Passed
ST_08	Marketplace Integration	Upload/download templates	Marketplace actions completed	Upload/download successful	Passed
ST_09	Report Generation	Export analysis report	PDF report downloaded	Report generated successfully	Passed
ST_10	Admin Dashboard	Manage users and logs	Dashboard functions correctly	Logs and reports displayed	Passed

Functional System Testing
Functional testing validated whether all modules performed according to the defined requirements.
Functional Areas Tested
	User authentication 
	Website scanning and analysis 
	AI issue detection 
	Recommendation generation 
	WCAG compliance validation 
	Report generation and export 
	Marketplace operations 
	Administrative controls 
Result:
All functional modules operated successfully according to project requirements.

Non-Functional System Testing
Non-functional testing evaluated system quality attributes such as performance, reliability, usability, and security.
Non-Functional Areas Tested
	Performance under multiple users 
	Stress handling and recovery 
	System responsiveness 
	Database reliability 
	User interface usability 
	Security validation 
Result:
The system demonstrated stable and reliable performance under different operating conditions.

Integration Testing Results

Integrated Modules	Result
Frontend ↔ Backend Communication	Successful
Backend ↔ AI Engine	Successful
Backend ↔ WCAG Engine	Successful
Backend ↔ Database	Successful
Marketplace ↔ Database	Successful
Report Module ↔ Storage System	Successful

	Regression Testing 

Regression Testing is a black box testing technique performed to ensure that recent code changes, bug fixes, enhancements, or updates have not negatively affected the existing functionalities of the system. In regression testing, previously executed test cases are re-run to verify that the application continues to function correctly after modifications.
In the AI Driven Website UI Enhancement System, regression testing was conducted after implementing new features, improving AI models, fixing defects, and updating database or interface components. The purpose was to ensure that all integrated modules continued working properly without introducing new errors.
Regression testing was repeatedly executed throughout the software development life cycle to maintain software stability and reliability.

Types of Regression Testing
	Final Regression Testing

Final Regression Testing was performed before the final deployment of the application. This testing verified that the final build remained stable and no major functionality was affected after the last updates and fixes.

Objectives

	Validate final software build 
	Ensure system stability before deployment 
	Confirm that all modules work correctly together 
	Verify no critical defects remain in the system 






Final Regression Testing Results

Test Scenario	Expected Result	Actual Result	Status
User Authentication	Login and registration work correctly	Successful	Passed
Website Analysis	Analysis reports generated correctly	Successful	Passed
AI Recommendation Engine	Recommendations displayed properly	Successful	Passed
WCAG Compliance Check	Accessibility reports generated	Successful	Passed
Marketplace Integration	Upload/download operations work correctly	Successful	Passed
Report Export	PDF reports generated successfully	Successful	Passed

	Normal Regression Testing

Normal Regression Testing was performed after every code modification, enhancement, or bug fix to verify that no existing functionality was broken.

Areas Tested

	Login and authentication system 
	Website analysis engine 
	AI issue detection and recommendations 
	WCAG compliance module 
	Database operations 
	Marketplace features 
	Report generation and export 

Regression Testing Scenarios

Test Case ID	Modified Module	Test Objective	Expected Result	Actual Result	Status
RT_01	Login Module	Verify login after authentication update	Login works correctly	Successful	Passed
RT_02	Registration Module	Verify account creation after validation changes	Account created successfully	Successful	Passed
RT_03	Website Analysis	Verify analysis after AI model update	Analysis reports generated	Successful	Passed
RT_04	Recommendation Engine	Verify recommendations after enhancement	Recommendations displayed correctly	Successful	Passed
RT_05	WCAG Compliance	Verify compliance checks after rule updates	Compliance report generated	Successful	Passed
RT_06	Marketplace Module	Verify uploads/downloads after database update	Marketplace works correctly	Successful	Passed
RT_07	Report Generation	Verify PDF export after report update	Report downloaded successfully	Successful	Passed
RT_08	Admin Dashboard	Verify admin controls after interface changes	Dashboard operates correctly	Successful	Passed


	Selecting Regression Tests 

One of the critical activities in regression testing is the selection of the appropriate regression tests to be executed after changes in the code are made, and that only tests that are most relevant and affected by the changes will be selected. It can be time consuming and expensive to run all test cases over and over again, so the selection of regression tests will be used to help optimize testing effort while ensuring software quality.

The AI Driven Website UI Enhancement System involved careful selection of regression tests, emphasizing their focus on system behavior, frequent changes to specific modules, regions where defects were likely to occur, and essential functions.

When picking regression test cases, the following factors were taken into account:

There are several factors to consider when choosing regression tests:

1. Knowledge about the system.

To select regression tests it is necessary to have a complete understanding of:

System architecture
Module dependencies
User workflows
Cooperation of components, interdependence.

Testing team investigated the impact of changes to one module on the other integrated modules, including:

Authentication system
AI recommendation engine
WCAG compliance module
Marketplace integration
Report generation services

2. Frequently Defective Areas

Test cases were chosen from the modules with frequent defects or failures that were historically identified.

Examples:
Login authentication validation
Website analysis processing
AI recommendation generation
Report export functionality

The modules were prioritized because they are very interactive and often updated.

3. Code Areas that are frequently modified.

Regression tests were performed on modules that were repeatedly changed during the development process or enhanced.

Frequently Updated Modules:
Recommendation Engine
Website Analysis Module
Marketplace Integration
Admin Dashboard
Report Generation Module

These tests helped to verify that there is no new defect that is introduced when repeated changes are made.

4. Critical Features of the System

These system functions always were a part of Regression test since if these functions fail, then the overall system can be affected.

Critical Features Selected:
User login and registration.
Website Analysis
WCAG Compliance Check
AI Recommendation Generation
Report Export
Database Connectivity

Although these features were not deemed high priority as they do not directly affect end users or system reliability, they are still being considered.

Regression Test ID	Module	Reason for Selection	Priority
RTS_01	User Login	Critical authentication functionality	High
RTS_02	Create Account	Frequently modified validation module	High
RTS_03	Website Analysis	Core functionality of the system	High
RTS_04	AI Recommendation Engine	Frequent AI model updates	High
RTS_05	WCAG Compliance Check	Critical accessibility validation	High
RTS_06	Report Generation	Frequently used export feature	Medium
RTS_07	Marketplace Integration	Repeated database modifications	Medium
RTS_08	Admin Dashboard	User management and monitoring	Medium


	Regression Testing Steps 

Regression testing is conducted in a systematic manner to make sure that any changes in the codebase, bug fixes or features of the system do not have a negative impact on its existing functionality. With the advent of modern software development, Regression testing has been automated in order to gain efficiency, save manpower and obtain optimum Return on Investment (ROI).

The AI Driven Website UI Enhancement System involved regular regression testing following changes to various modules, including authentication, AI recommendation engine, WCAG compliance checking, website analysis, and report generation.

During regression testing, the following steps were taken:

 Click on the Test for Regression option.

The first step was identifying and choosing the relevant test cases that are impacted by modifications to their code.

The testing team chose tests that met the following criteria:

Frequently modified modules
Critical functionalities
Previously defective areas
Integration dependencies
Selected Modules
User Authentication
Website Analysis
Recommendation Engine
WCAG Compliance Module
Report Generation
Marketplace Integration

2. Choose the Appropriate Tool and Automate Regression Tests

The repetitive regression test cases were identified and automated to run efficiently.

Tools Used
Selenium for Web UI Testing
A postman for the API test.
Using PyTest as backend for testing.PyTest as a backend for testing.
The Browser Developer Tools are used to validate the UI for the browser.

Automation reduced:

Manual testing effort
Execution time
Human errors
Checkpoints are used to verify applications.The checkpoints are used to verify applications.

Application changes were checked at various checkpoints for verification.

Verification Areas
The logon and authentication process.The logon and authentication sequence.
AI recommendation generation
Website analysis results
Database connectivity
WCAG report accuracy
Report export functionality

Each checkpoint checked that the modified functionality did not cause errors in other modules and that it produced the correct results.

Note: This section has been rearranged.Note: This section has been reordered.

Any regression test cases were updated whenever:

Some new features were added
Existing workflows changed
New defect(s) found

This made sure that the regression test suite was up to date and correct for the latest system requirements.

Example
New regression tests for upload/download workflows were needed when marketplace integration was added.
Recommendation validation tests were needed for AI model updates.Validation tests were needed for the AI models to be updated.

Schedule the Tests

Regression tests were scheduled regularly during the development lifecycle.

Testing Schedule
However, major code changes have occurred since then.
After defect fixes
Before deployment
Before final release

The software build was constantly validated with automated scheduling.

 Integrate with the Builds

Regression tests were added to system builds to ensure the entire software suite was validated for each software version.

Build Integration Areas
Frontend updates
Backend API updates
Database schema modifications
AI engine enhancements

This assisted in identifying integration problems at the start of the development process.

 Analyze the Results

Following regression testing, the results were scrutinized to find out which of the following were considered:

Failed test cases
System defects
Performance issues
Integration problems

Documented and resolved defects during regression test prior to deployment.



 



