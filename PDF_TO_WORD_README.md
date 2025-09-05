# PDF to Word Conversion Feature

This feature allows you to convert PDF files to Word documents using the ConvertAPI service.

## Setup

### 1. Install Dependencies

First, install the required ConvertAPI package:

```bash
npm install convertapi
```

### 2. Environment Configuration

You need to set up your ConvertAPI secret key as an environment variable. 

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
CONVERTAPI_SECRET=your_convertapi_secret_key_here
```

**To get your ConvertAPI secret key:**
1. Sign up at [ConvertAPI](https://www.convertapi.com/)
2. Go to your dashboard
3. Copy your secret key
4. Replace `your_convertapi_secret_key_here` with your actual secret key

### 3. API Endpoints

The PDF to Word conversion feature provides the following endpoints:

#### Convert PDF to Word
- **POST** `/pdf-to-word`
- **Body:**
  ```json
  {
    "fileId": "uploaded_file_id",
    "outputName": "optional_output_filename.docx"
  }
  ```
- **Response:**
  ```json
  {
    "message": "PDF converted to Word successfully",
    "fileName": "converted-uuid.docx",
    "downloadUrl": "/pdf-to-word/download/converted-uuid.docx"
  }
  ```

#### Download Converted File
- **GET** `/pdf-to-word/download/:fileName`
- Downloads the converted Word document

#### Get File Info
- **GET** `/pdf-to-word/info/:fileName`
- Returns information about the converted file (size, creation date, etc.)

## Usage Flow

1. **Upload a PDF file** using the existing upload endpoint
2. **Convert the PDF** by calling the `/pdf-to-word` endpoint with the file ID
3. **Download the Word document** using the provided download URL

## File Management

- Original uploaded files are automatically cleaned up after 1 hour
- Converted Word documents are automatically cleaned up after 2 hours
- Files are stored in the `./temp` directory during processing

## Error Handling

The service includes comprehensive error handling for:
- Missing file IDs
- File not found errors
- ConvertAPI conversion failures
- Missing environment variables

## Security Notes

- Never commit your ConvertAPI secret key to version control
- Use environment variables for sensitive configuration
- The service validates file existence before processing
- Automatic cleanup prevents disk space issues

## Example Usage

```javascript
// Convert a PDF to Word
const response = await fetch('/pdf-to-word', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileId: 'uploaded-pdf-file-id',
    outputName: 'my-document.docx'
  })
});

const result = await response.json();
console.log(result.downloadUrl); // Use this URL to download the converted file
```
