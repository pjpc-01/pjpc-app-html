# Google Sheets to Firebase Import Setup

This guide explains how to set up the Google Sheets API integration to import student data into Firebase Firestore.

## Prerequisites

1. A Google Cloud Project
2. A Google Sheets document with student data
3. Firebase project configured

## Step 1: Set up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `sheets-import-service`
   - Description: `Service account for importing sheets data`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 3: Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the JSON file

## Step 4: Share Google Sheets Document

1. Open your Google Sheets document
2. Click "Share" in the top right
3. Add the service account email (found in the JSON file) with "Editor" permissions
4. The email format is: `sheets-import-service@your-project-id.iam.gserviceaccount.com`

## Step 5: Prepare Your Data

Your Google Sheets should have the following columns (headers in the first row):

| Name | Grade | Parent Name | Parent Email | Phone | Address | Enrollment Date | Status |
|------|-------|-------------|--------------|-------|---------|-----------------|--------|
| John Doe | 三年级 | Jane Doe | jane@example.com | 123-456-7890 | 123 Main St | 2024-01-15 | Active |

**Required columns:**
- Name
- Grade  
- Parent Name
- Parent Email

**Optional columns:**
- Phone
- Address
- Enrollment Date
- Status

## Step 6: Get Spreadsheet ID

The spreadsheet ID is found in the URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                        This is your Spreadsheet ID
```

## Step 7: Use the Import Tool

1. Navigate to `/data-import` in your application
2. Enter the Spreadsheet ID
3. Paste the entire JSON content from your service account key file
4. Click "Validate" to check if your spreadsheet structure is correct
5. Click "Preview Data" to see a sample of your data
6. Click "Import to Firestore" to import all data

## Troubleshooting

### Common Issues:

1. **"Invalid spreadsheet structure"**
   - Make sure your headers match the required field names
   - Check that the first row contains headers
   - Ensure the service account has access to the spreadsheet

2. **"No data found in spreadsheet"**
   - Verify the spreadsheet ID is correct
   - Check that the service account has been shared with the document
   - Ensure there is data in the specified range

3. **Authentication errors**
   - Verify the JSON credentials are complete and valid
   - Check that the Google Sheets API is enabled in your project
   - Ensure the service account has the necessary permissions

### Security Notes:

- Never commit the service account JSON file to version control
- Consider using environment variables for production
- Regularly rotate service account keys
- Use the principle of least privilege when setting permissions

## After Import

Once the data is imported:

1. Your application will automatically use Firestore data instead of static data
2. The `useStudents` hook will fetch data from Firestore
3. All student management features will work with the imported data
4. You can update, delete, and manage students through the application

## Data Structure

The imported data will be stored in Firestore with the following structure:

```javascript
{
  id: "auto-generated-id",
  name: "Student Name",
  grade: "三年级",
  parentName: "Parent Name", 
  parentEmail: "parent@example.com",
  phone: "123-456-7890",
  address: "123 Main St",
  enrollmentDate: "2024-01-15",
  status: "Active",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  importedFrom: "google-sheets"
}
``` 