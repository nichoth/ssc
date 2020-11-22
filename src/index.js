var stripe = Stripe('pk_test_IRey7snzagoQj4MI1BV91vRv00ebgkZoJw')
var elements = stripe.elements()
var PRICE_ID = 'price_1HpPOxBnqQbRlIvQeMvblXi5'

// /.netlify/functions/hello

document.getElementById("checkout").addEventListener("click", function (ev) {
    createCheckoutSession(PRICE_ID).then(function (res) {
        console.log('create checkout session', res)
        // error:
            // message: "No such price: 'price_1HpPOxBnqQbRlIvQeMvblXi5'

        // Call Stripe.js method to redirect to the new Checkout page
        stripe.redirectToCheckout({
            sessionId: res.sessionId
        }).then(res => console.log('redirect to checkout', res))
    })
})
 
function createCheckoutSession (priceId) {
    return fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            priceId: priceId
        })
    }).then(function(result) {
        return result.json()
    })
}





// this part is for stripe elements

// // After the form loads, create an instance of an Element and mount
// // it to the Element container.
// var style = {
//     base: {
//         color: "#32325d",
//         fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//         fontSmoothing: "antialiased",
//         fontSize: "16px",
//         "::placeholder": {
//             color: "#aab7c4"
//         }
//     },
//     invalid: {
//         color: "#fa755a",
//         iconColor: "#fa755a"
//     }
// }
// var card = elements.create("card", { style: style })
// card.mount("#card-element")

// // To help your customers catch mistakes, listen to change events on the
// // card Element and display any errors.
// card.on('change', function (event) {
//     console.log('change', event)
//     var displayError = document.getElementById('card-errors')
//     if (event.error) {
//         displayError.textContent = event.error.message
//     } else {
//         displayError.textContent = ''
//     }
// })


// function createCustomer ({ email }) {
//     return fetch('/.netlify/functions/create-customer', {
//         method: 'post',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ email })
//     })
//         .then((response) => {
//             return response.json()
//         })
//         .then((result) => {
//             // result.customer.id is used to map back to the customer object
//             // result.setupIntent.client_secret is used to create the
//             // payment method
//             return result
//         })
// }


// let signupForm = document.getElementById('signup-form')
// signupForm.addEventListener('submit', function (ev) {
//     ev.preventDefault()
//     console.log('submit ev', ev.target.elements)

//     // --------------------------------------------------------------------
//     // If a previous payment was attempted, get the latest invoice
//     const latestInvoicePaymentIntentStatus = localStorage.getItem(
//         'latestInvoicePaymentIntentStatus'
//     )

//     if (latestInvoicePaymentIntentStatus === 'requires_payment_method') {
//         const invoiceId = localStorage.getItem('latestInvoiceId')
//         // create new payment method & retry payment on invoice with
//         // new payment method
//         createPaymentMethod({
//             card,
//             isPaymentRetry: true,
//             invoiceId,
//         })
//     } else {
//         // create new payment method & create subscription
//         createPaymentMethod({ card })
//     }
//     //​ --------------------------------------------------------------------

//     var { email } = ev.target.elements
//     // Create Stripe customer
//     createCustomer({ email: email.value }).then(result => {
//         // TODO -- something here
//         customer = result.customer
//     })
//         .then(res => console.log('customer created', res))
//         .catch(err => console.log('err', err))
// })

// function createPaymentMethod({ card, name, isPaymentRetry, invoiceId }) {
//     // Set up payment method for recurring usage
//     // let billingName = document.querySelector('#name').value;
//     stripe.createPaymentMethod({
//         type: 'card',
//         card: card,
//         billing_details: { name },
//     })
//         .then(result => {
//             console.log('result', result)
//             if (result.error) {
//                 return displayError(result)
//             }

//             if (isPaymentRetry) {
//                 // Update the payment method and retry invoice payment
//                 retryInvoiceWithNewPaymentMethod({
//                     customerId: customerId,
//                     paymentMethodId: result.paymentMethod.id,
//                     invoiceId: invoiceId,
//                     priceId: priceId
//                 });
//             } else {
//                 // Create the subscription
//                 createSubscription({
//                     customerId: customerId,
//                     paymentMethodId: result.paymentMethod.id,
//                     priceId: priceId
//                 })
//             }
//         })
//         .catch(err => console.log('errrr', err))
// }

// // -----------------------------------------------



// function retryInvoiceWithNewPaymentMethod({
//     customerId,
//     paymentMethodId,
//     invoiceId,
//     priceId
// }) {
//     return (
//         fetch('/retry-invoice', {
//             method: 'post',
//             headers: {
//             'Content-type': 'application/json',
//             },
//             body: JSON.stringify({
//             customerId: customerId,
//             paymentMethodId: paymentMethodId,
//             invoiceId: invoiceId,
//         })
//     })
//         .then((response) => {
//             return response.json();
//         })
//         // If the card is declined, display an error to the user.
//         .then((result) => {
//             if (result.error) {
//                 // The card had an error when trying to attach it to a customer.
//                 throw result
//             }
//             return result
//         })
//         // Normalize the result to contain the object returned by Stripe.
//         // Add the additional details we need.
//         .then((result) => {
//             return {
//                 // Use the Stripe 'object' property on the
//                 // returned result to understand what object is returned.
//                 invoice: result,
//                 paymentMethodId: paymentMethodId,
//                 priceId: priceId,
//                 isRetry: true
//             }
//         })
//         // Some payment methods require a customer to be on session
//         // to complete the payment process. Check the status of the
//         // payment intent to handle these actions.
//         .then(handlePaymentThatRequiresCustomerAction)
//         // No more actions required. Provision your service for the user.
//         .then(onSubscriptionComplete)
//         .catch((error) => {
//             // An error has happened. Display the failure to the user here.
//             // We utilize the HTML element we created.
//             displayError(error);
//         })
//     )
// }
  






// // ----------------------------------------------------------
// function createSubscription({ customerId, paymentMethodId, priceId }) {
//     return (
//         fetch('/create-subscription', {
//             method: 'post',
//             headers: {
//                 'Content-type': 'application/json'
//             },
//             body: JSON.stringify({
//                 customerId: customerId,
//                 paymentMethodId: paymentMethodId,
//                 priceId: priceId
//             })
//         })
//             .then((response) => {
//                 return response.json()
//             })
//             // If the card is declined, display an error to the user.
//             .then((result) => {
//                 if (result.error) {
//                     // The card had an error when trying to attach it to a customer.
//                     throw result
//                 }
//                 return result
//             })
//             // Normalize the result to contain the object returned by Stripe.
//             // Add the additional details we need.
//             .then((sub) => {
//                 return {
//                     paymentMethodId: paymentMethodId,
//                     priceId: priceId,
//                     subscription: sub
//                 }
//             })
//             // Some payment methods require a customer to be on session
//             // to complete the payment process. Check the status of the
//             // payment intent to handle these actions.
//             .then(handlePaymentThatRequiresCustomerAction)
//             // If attaching this card to a Customer object succeeds,
//             // but attempts to charge the customer fail, you
//             // get a requires_payment_method error.
//             .then(handleRequiresPaymentMethod)
//             // No more actions required. Provision your service for the user.
//             .then(onSubscriptionComplete)
//             .catch((error) => {
//                 // An error has happened. Display the failure to the
//                 // user here.
//                 // We utilize the HTML element we created.
//                 showCardError(error)
//             })
//     )
// }
// // ----------------------------------------------------------



// function handleRequiresPaymentMethod (opts) {
//     var { subscription, paymentMethodId, priceId } = opts

//     if (subscription.status === 'active') {
//         // subscription is active, no customer actions required.
//         return { subscription, priceId, paymentMethodId }
//     }

//     if (subscription.latest_invoice.payment_intent.status ===
//         'requires_payment_method') {
//         // Using localStorage to manage the state of the retry here,
//         // feel free to replace with what you prefer.
//         // Store the latest invoice ID and status.
//         localStorage.setItem('latestInvoiceId',
//             subscription.latest_invoice.id)
//         localStorage.setItem('latestInvoicePaymentIntentStatus',
//             subscription.latest_invoice.payment_intent.status)
//         throw { error: { message: 'Your card was declined.' } };
//     } else {
//         return { subscription, priceId, paymentMethodId };
//     }
// }






// function onSubscriptionComplete (res) {
//     console.log('sub complete', res)
//     // Payment was successful.
//     if (res.subscription.status === 'active') {
//         // Change your UI to show a success message to your customer.
//         // Call your backend to grant access to your service based on
//         // `res.subscription.items.data[0].price.product` the customer
//         // subscribed to.
//     }
// }
  




// function handlePaymentThatRequiresCustomerAction({
//     subscription,
//     invoice,
//     priceId,
//     paymentMethodId,
//     isRetry
//   }) {
//     if (subscription && subscription.status === 'active') {
//         // Subscription is active, no customer actions required.
//         return { subscription, priceId, paymentMethodId };
//     }
  
//     // If it's a first payment attempt, the payment intent is on the subscription latest invoice.
//     // If it's a retry, the payment intent will be on the invoice itself.
//     let paymentIntent = invoice ? invoice.payment_intent : subscription.latest_invoice.payment_intent;
  
//     if (
//         paymentIntent.status === 'requires_action' ||
//         (isRetry === true &&
//             paymentIntent.status === 'requires_payment_method')
//     ) {
//         return stripe.confirmCardPayment(paymentIntent.client_secret, {
//                 payment_method: paymentMethodId,
//             })
//             .then((result) => {
//                 if (result.error) {
//                     // Start code flow to handle updating the payment details.
//                     // Display error message in your UI.
//                     // The card was declined (i.e. insufficient funds,
//                     // card has expired, etc).
//                     throw result;
//                 } 
//                 if (result.paymentIntent.status === 'succeeded') {
//                     // Show a success message to your customer.
//                     // There's a risk of the customer closing the window
//                     // before the callback.
//                     // We recommend setting up webhook endpoints later in
//                     // this guide.
//                     return {
//                         priceId: priceId,
//                         subscription: subscription,
//                         invoice: invoice,
//                         paymentMethodId: paymentMethodId,
//                     }
//                 }
//             })
//             .catch((error) => {
//                 displayError(error);
//             })
//     } else {
//         // No customer action needed.
//         return { subscription, priceId, paymentMethodId }
//     }
// }




// function cancelSubscription() {
//     return fetch('/cancel-subscription', {
//       method: 'post',
//     headers: {
//         'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//         subscriptionId: subscriptionId,
//     }),
//     })
//     .then(response => {
//         return response.json();
//     })
//     .then(cancelSubscriptionResponse => {
//         // Display to the user that the subscription has been cancelled.
//     });
// }

