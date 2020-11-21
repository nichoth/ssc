var stripe = Stripe('pk_test_IRey7snzagoQj4MI1BV91vRv00ebgkZoJw')
var elements = stripe.elements()

function createCustomer ({ email }) {
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
    console.log('submit ev', ev)

    // --------------------------------------------------------------------
    // If a previous payment was attempted, get the latest invoice
    const latestInvoicePaymentIntentStatus = localStorage.getItem(
        'latestInvoicePaymentIntentStatus'
    )

    if (latestInvoicePaymentIntentStatus === 'requires_payment_method') {
        const invoiceId = localStorage.getItem('latestInvoiceId')
        // create new payment method & retry payment on invoice with
        // new payment method
        createPaymentMethod({
            card,
            isPaymentRetry: true,
            invoiceId,
        })
    } else {
        // create new payment method & create subscription
        createPaymentMethod({ card })
    }
    //​ --------------------------------------------------------------------

    var { email } = ev.target.elements
    // Create Stripe customer
    createCustomer({ email: email.value }).then(result => {
        // TODO -- something here
        customer = result.customer
    })
        .then(res => console.log('customer created', res))
        .catch(err => console.log('err', err))

})

function createPaymentMethod({ card, name, isPaymentRetry, invoiceId }) {
    // Set up payment method for recurring usage
    // let billingName = document.querySelector('#name').value;
    stripe.createPaymentMethod({
        type: 'card',
        card: card,
        billing_details: { name },
    })
        .then(result => {
            console.log('result', result)
            if (result.error) {
                return displayError(result)
            }

            if (isPaymentRetry) {
                // Update the payment method and retry invoice payment
                retryInvoiceWithNewPaymentMethod({
                    customerId: customerId,
                    paymentMethodId: result.paymentMethod.id,
                    invoiceId: invoiceId,
                    priceId: priceId
                });
            } else {
                // Create the subscription
                createSubscription({
                    customerId: customerId,
                    paymentMethodId: result.paymentMethod.id,
                    priceId: priceId
                })
            }
        })
        .catch(err => console.log('errrr', err))
}

// -----------------------------------------------


// Set your publishable key: remember to change this to your live
// publishable key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
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

// To help your customers catch mistakes, listen to change events on the
// card Element and display any errors.
cardElement.on('change', function (event) {
    console.log('change', event)
    var displayError = document.getElementById('card-errors')
    if (event.error) {
        displayError.textContent = event.error.message
    } else {
        displayError.textContent = ''
    }
})
