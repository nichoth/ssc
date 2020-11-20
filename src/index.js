function createCustomer({ email }) {
    return fetch('/.netlify/functions/create-customer', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
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
signupForm.addEventListener('submit', function (ev) {
    ev.preventDefault()
    var { email } = ev.target.elements
    // Create Stripe customer
    createCustomer({ email }).then((result) => {
        customer = result.customer
    })
})

