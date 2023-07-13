const axios = require('axios');
const cheerio = require('cheerio');
const stripTags = require('strip-tags');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function fetchAmazonProductDetails(keyword, retryCount = 0) {
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const productDetails = [];

    $('.s-result-item').each((_, element) => {
      const sellerName = stripTags($(element).find('.s-lockup-title').html()).trim();
      const productTitle = stripTags($(element).find('.a-link-normal .a-text-normal').html()).trim();
      const price = stripTags($(element).find('.a-offscreen').html()).trim();

      if (sellerName && productTitle && price) {
        productDetails.push({ sellerName, productTitle, price });
      }
    });

    return productDetails;
  } catch (error) {
    console.error('An error occurred:', error);

    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchAmazonProductDetails(keyword, retryCount + 1);
    } else {
      console.log('Maximum retry attempts reached.');
      return []; // Return an empty result or handle the error as needed
    }
  }
}

function promptUser() {
  rl.question('Enter a product name: ', async (product) => {
    const productDetails = await fetchAmazonProductDetails(product);

    if (productDetails.length > 0) {
      console.log('Product Details:');
      productDetails.forEach((details, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log('Seller Name:', details.sellerName);
        console.log('Product Title:', details.productTitle);
        console.log('Price:', details.price);
      });
    } else {
      console.log('No product details found.');
    }

    rl.close();
  });
}

promptUser();
