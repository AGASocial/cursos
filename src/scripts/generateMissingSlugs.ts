import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, authenticateAdmin } from './firebase-admin';
import { slugify } from '../utils/slugify';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ACADEMIES_COLLECTION = process.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = process.env.VITE_AGA_ACADEMY;

// Get admin credentials from environment variables
const ADMIN_EMAIL = process.env.VITE_AGA_ACADEMY_CREATOR || 'byagasocial@gmail.com';
const ADMIN_PASSWORD = process.env.VITE_AGA_ADMIN_PASSWORD || '';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Admin credentials not found in environment variables');
  process.exit(1);
}

async function generateMissingSlugs() {
  try {
    console.log('Authenticating as admin...');
    await authenticateAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);
    
    console.log('Starting slug generation for existing courses...');
    
    // Get all courses
    const academyId = ACADEMY;
    if (!academyId) {
      throw new Error('Academy ID is not defined in environment variables');
    }
    const coursesRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    // Keep track of used slugs to ensure uniqueness
    const usedSlugs = new Set<string>();
    
    // Count of updated courses
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each course
    for (const courseDoc of snapshot.docs) {
      const courseData = courseDoc.data();
      
      // Skip if course already has a slug
      if (courseData.slug) {
        usedSlugs.add(courseData.slug);
        skippedCount++;
        continue;
      }
      
      // Generate base slug from title
      let baseSlug = slugify(courseData.title);
      let slug = baseSlug;
      let counter = 1;
      
      // Ensure slug uniqueness
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Add to used slugs set
      usedSlugs.add(slug);
      
      // Update the course with the new slug
      const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseDoc.id);
      await updateDoc(courseRef, { slug });
      
      updatedCount++;
      console.log(`Updated course "${courseData.title}" with slug: ${slug}`);
    }
    
    console.log('\nSlug generation completed:');
    console.log(`- ${updatedCount} courses updated`);
    console.log(`- ${skippedCount} courses skipped (already had slugs)`);
    console.log(`- ${snapshot.docs.length} total courses processed`);
    
  } catch (error) {
    console.error('Error generating slugs:', error);
    throw error;
  }
}

// Execute the script
generateMissingSlugs().catch(console.error);
