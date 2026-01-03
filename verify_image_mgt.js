
const fs = require('fs');
const http = require('http');

const API_PORT = 5000;
const API_HOST = 'localhost';
const ADMIN_EMAIL = 'admin@dona.com';
const ADMIN_PASSWORD = 'Admin123!';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      if (headers['Content-Type']?.includes('multipart/form-data')) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function verify() {
  console.log('🚀 Starting verification (No Deps)...');

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginRes = await request('POST', '/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    if (loginRes.status !== 200) {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.data.token;
    console.log('✅ Logged in.');

    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. Create Product
    console.log('2️⃣ Creating product...');
    // Get category first
    const catRes = await request('GET', '/categories', null, authHeader);
    const category = catRes.data.data[0];
    
    if (!category) throw new Error('No categories found.');

    const productData = {
      name: `Test Product ${Date.now()}`,
      slug: `test-product-${Date.now()}`,
      categoryId: category.id,
      categorySlug: category.slug,
      description: 'Test Description',
      longDescription: 'Long Test Description',
      images: ['http://initial.com/1.jpg', 'http://initial.com/2.jpg'],
      materials: ['wood'],
      keyFeatures: ['test'],
    };

    const createRes = await request('POST', '/products', productData, authHeader);
    if (createRes.status !== 201) {
         throw new Error(`Create product failed: ${JSON.stringify(createRes.data)}`);
    }
    const slug = createRes.data.data.slug;
    console.log(`✅ Product created: ${slug}`);

    // 3. Patch Image
    console.log('3️⃣ Patching image...');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fileContent = fs.readFileSync('test_image.jpg');
    
    const pre = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([pre, fileContent, post]);

    const patchRes = await request(
      'PATCH',
      `/products/${slug}/images/0`,
      multipartBody,
      {
        ...authHeader,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
      }
    );

    if (patchRes.status === 200) {
        console.log('✅ Image patched.');
        // console.log(patchRes.data.data.images);
    } else {
        console.error('❌ Patch failed:', patchRes.status, patchRes.data);
    }

    // 4. Delete Image
    console.log('4️⃣ Deleting image...');
    const deleteRes = await request('DELETE', `/products/${slug}/images/1`, null, authHeader);
    
    if (deleteRes.status === 200) {
        console.log('✅ Image deleted.');
        if (deleteRes.data.data.images.length === 1) {
            console.log('   Count verified.');
        }
    } else {
        console.error('❌ Delete failed:', deleteRes.status, deleteRes.data);
    }
    
    // Cleanup
    await request('DELETE', `/products/${slug}`, null, authHeader);
    console.log('✅ Cleanup done.');

  } catch (e) {
    console.error('❌ Error:', e);
  }
}

verify();
