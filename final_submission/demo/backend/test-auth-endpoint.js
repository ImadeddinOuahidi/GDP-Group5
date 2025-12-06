// Simple test to check the auth API endpoint
const testAuthEndpoint = async () => {
  const credentials = {
    email: 'patient1@example.com',
    password: '1234'
  };

  console.log('Testing auth API endpoint...');
  console.log('URL: http://localhost:3000/api/auth/signin');
  console.log('Payload:', JSON.stringify(credentials, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    console.log('\nResponse status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    // Try to parse as JSON
    try {
      const responseData = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }

  } catch (error) {
    console.error('Fetch error:', error.message);
  }
};

// Run the test
testAuthEndpoint();