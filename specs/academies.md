# Academy Creation Specification

## User Interface

1. **Create Academy Button**
   - A button with the same style as the Administrator button will be displayed after user registration in the top navbar.
   - Button text: "Create academy"
   - Location: Same area and styleas Administrator button

2. **Academy CRUD Component**
   - Accessed when user clicks "Create academy" button
   - Contains a "+ Create academy" button to initiate new academy creation.

3. **Academy Details Form**
   - Fields:
     - Name (mandatory)
       - Must be validated for Firebase collection name compatibility
       - Real-time validation with user feedback
       - Visual cues for correct/incorrect format
     - Description (optional)
       - Text area for academy description

## Data Structure

### Firebase Collections

1. **Academies Collection**
   - Path: `/VITE_FIREBASE_FIRESTORE_ROOT/newAcademyName/`
   - Fields:
     - creatorId: string (userId of creator)
     - name: string
     - description: string
     - createdAt: timestamp

2. **Users Collection Update**
   - New fields added to user document:
     - academies: array (contains academy names)
     - currentAcademy: string (name of selected academy)

## Business Logic

1. **Academy Creation Process**
   - Validate academy name format
   - Create new academy collection
   - Update user document with new academy
   - Set current academy for user

2. **Validation Rules**
   - Academy name must be valid for Firebase collection
   - Creator ID must be authenticated user
   - Creation timestamp must be server-generated