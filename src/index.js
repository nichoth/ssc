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
          // result.setupIntent.client_secret is used to create the
          // payment method
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


// -----------------------------------------------


// Set your publishable key: remember to change this to your live
// publishable key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
var stripe = Stripe('pk_test_IRey7snzagoQj4MI1BV91vRv00ebgkZoJw')
var elements = stripe.elements()

var style = {
    base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
            color: "#aab7c4"
        }
    },
    invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
    }
}

// After the form loads, create an instance of an Element and mount
// it to the Element container.
var cardElement = elements.create("card", { style: style })
cardElement.mount("#card-element")
