function createCustomer() {
    let billingEmail = document.querySelector('#email').value;

    return fetch('/.netlify/functions/create-customer', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: billingEmail,
        })
    })
      .then((response) => {
          return response.json()
      })
      .then((result) => {
          // result.customer.id is used to map back to the customer object
          // result.setupIntent.client_secret is used to create the payment method
          return result
      })
}

let signupForm = document.getElementById('signup-form')
signupForm.addEventListener('submit', function (evt) {
    evt.preventDefault()
    // Create Stripe customer
    createCustomer().then((result) => {
        customer = result.customer
    })
})

