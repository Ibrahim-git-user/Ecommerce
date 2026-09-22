# My Ecommerce Project built using React.js (vite) and Django Rest Apis with Payment Integration (Stripe).

Information about this project:
1.It uses jwt based authentication for login.
2.There are totally three microservices available in this. Such as, AuthService, OrderMicroservice, PaymentMicroservice.
3.AuthService is using custom User model (named as Member). It is different from what Django offers. Basically it has extra fields such as email id, phone number, user_role (Customer/Supervisor/Staff/Seller) and allow us to login using email and password.
The default primary key "id" is replaced by UUID in the User model (renamed as Member in this project). So for every users, their id is "uuid".
4.OrderMicroservice and PaymentMicroservice are communicating through events (kafka).
5.All these services are having isolated databases in Postgresql server.
AuthService will be using auth_db database. 
PaymentMicroservice will be using payments_db database.
OrderMicroservice will be using order_db database.
6.Frontend is built using react (vite). The src files are available in ProductCatalog folder.

We use Stripe Elements for payment processing.(it means that the payment gateway is embedded in our webpage itself rather than redirecting customer to stripe's checkout page and doing the payment processing.


## Table of Contents
- [Tech Stack]
- [Usage](#usage)
- [License](#license)


### Tech Stack

- **React**
- **Django Rest API**
- **JWT**
- **KAFKA**
- **POSTGRESQL**
- **Docker**

## Usage
Steps to run this app:

Pre-requisite: Before running this app, signup into stripe and create a test account.


1.Clone this github repo (Ecommerce) locally in your machine.
2.In the PaymentMicroservice folder there is a file called .env.  Find "stripe_secret_key" in stripe's test account and put it in .env file against the key: STRIPE_SECRET_KEY.
3.Install stripe cli in terminal. Then, run the command: stripe login and connect with your stripe test account.
4.Now, open another terminal and run the command: stripe listen --forward-to localhost:8002/paymentservice/stripe/webhook/ in your local machine.
This command will generate a webhook secret. Put that secret key in .env file against the key: STRIPE_WEBHOOK_SECRET
Step 3 and 4 are necessary to receive payment events from stripe. If you fail to do this, then status of your order will not be changed from Pending to Paid after your successfully place your order.

After these steps, your PaymentMicroservice/.env file will look similar to this:
STRIPE_SECRET_KEY=sk_test_******************
STRIPE_WEBHOOK_SECRET=whsec_*****************


5.In the frontend's .env file, put stripe's publishable_key. You can find this key in your test account in stripe under stripe_secret_key.

ProductCatalog/.env file will look like this:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_***************


Now the configuration steps are over.


To locally run this microservice based ecommerce app, 
cd EcommerceMicroservice/   -- in this folder where the docker-compose.yml file exists.
run "docker compose up --build -d"

If the containers are failing to start, then ensure that you have the proper .env files (updated with keys from stripe) under the folders "PaymentMicroservice" and "ProductCatalog".

Now open the browser with url: http://localhost:5173/ to see the e-commerce app.


Note: Use a dummy card to place the order. Stripe is providing some card details for testing. Find the card details below:
Card number: 4242 4242 4242 4242
Expiry: 12/34
CVV: 123



## License

This project is licensed under the License - see the [LICENSE](https://github.com/Ibrahim-git-user/Ecommerce/blob/main/LICENSE) file for details.

---

Made with ❤ by [Ibrahim-git-user](https://github.com/Ibrahim-git-user)
