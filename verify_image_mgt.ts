
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@dona.com';
const ADMIN_PASSWORD = 'Admin123!';

async function verify() {
  console.log('🚀 Starting verification...');

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const token = loginRes.data.data.token;
    console.log('✅ Logged in. Token received.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create Product (Dummy data)
    console.log('2️⃣ Creating dummy product...');
    const productData = {
      name: `Test Product ${Date.now()}`,
      slug: `test-product-${Date.now()}`,
      categoryId: '',
      categorySlug: 'vases', // Assuming this exists or we need to find one
      description: 'Test Description',
      longDescription: 'Long Test Description',
      images: ['http://initial.com/image1.jpg', 'http://initial.com/image2.jpg'],
      materials: ['wood'],
      keyFeatures: ['test'],
    };

    // Find a category first
    const catRes = await axios.get(`${API_URL}/categories`, { headers });
    if (catRes.data.data.length === 0) {
        throw new Error('No categories found to create product under.');
    }
    const category = catRes.data.data[0];
    productData.categoryId = category.id;
    productData.categorySlug = category.slug;

    const createRes = await axios.post(`${API_URL}/products`, productData, { headers });
    const slug = createRes.data.data.slug;
    console.log(`✅ Product created: ${slug}`);

    // 3. Patch Image at Index 0
    console.log('3️⃣ Patching image at index 0...');
    const form = new FormData();
    form.append('file', fs.createReadStream('test_image.jpg'), {
        contentType: 'image/jpeg',
        filename: 'test_image.jpg',
    });

    const patchRes = await axios.patch(
      `${API_URL}/products/${slug}/images/0`,
      form,
      {
        headers: {
          ...headers,
          ...form.getHeaders(),
        },
      }
    );
    console.log('✅ Image patched.');
    const newImages = patchRes.data.data.images;
    if (newImages[0].includes('test_image') || newImages[0].includes('http://localhost:5000/uploads')) {
        console.log('   Verified image URL updated.');
    } else {
        console.error('   ❌ Image URL did not update as expected:', newImages[0]);
    }

    // 4. Delete Image at Index 1
    console.log('4️⃣ Deleting image at index 1...');
    const deleteRes = await axios.delete(`${API_URL}/products/${slug}/images/1`, { headers });
    console.log('✅ Image deleted.');
    const finalImages = deleteRes.data.data.images;
    if (finalImages.length === 1) {
         console.log('   Verified image count is 1.');
    } else {
         console.error('   ❌ Image count is not 1:', finalImages.length);
    }
    
    // Cleanup - Delete product
     console.log('5️⃣ Cleanup: Deleting product...');
     await axios.delete(`${API_URL}/products/${slug}`, { headers });
     console.log('✅ Cleanup done.');

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Error response:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

verify();
