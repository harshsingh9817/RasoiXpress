# URGENT: Fix for `rasoi-rider-connect` Database

The `permission-denied` and `admin-restricted-operation` errors are because your second Firebase project (`rasoi-rider-connect`) is not configured to allow the main application to connect to it.

Please perform the following two steps in your **`rasoi-rider-connect`** project to fix this.

---

### Step 1: Enable Anonymous Sign-In

Your main application needs to sign in to the rider database to listen for order updates. You must enable this sign-in method.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your **`rasoi-rider-connect`** project from the list.
3.  In the left menu, go to **Build** > **Authentication**.
4.  Click on the **Sign-in method** tab.
5.  Find **Anonymous** in the list of providers and click the pencil icon to edit it.
6.  **Enable** the toggle switch and click **Save**.

---

### Step 2: Update Firestore Security Rules

The security rules for your rider database need to be updated to allow the main application to read and write order data.

1.  In the same `rasoi-rider-connect` project, go to **Build** > **Firestore Database**.
2.  Click on the **Rules** tab at the top.
3.  Replace the existing rules with the code below:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions ---

    // This function checks if a user is authenticated.
    // This will be TRUE for the main app's anonymous login session.
    function isAuthenticated() {
      return request.auth != null;
    }

    // This function checks for the specific admin email.
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'harshsingh9817@gmail.com';
    }

    // --- Collection Rules ---

    // Orders are read and updated by the Rider App.
    match /orders/{orderId} {
      // Allow any authenticated session (including anonymous) to read and update.
      allow read, update: if isAuthenticated();

      // Only the admin from the main app can create or delete orders in this database.
      allow create, delete: if isAdmin();
    }

    // Riders collection is not used by the rider app directly.
    match /riders/{riderId} {
        allow read, write: if false;
    }

    // Default deny access to any other collections to ensure security.
    match /{path=**} {
      allow read, write: if false;
    }
  }
}
```

4.  Click the **Publish** button.

---

After completing these two steps, the permission errors in your application will be resolved.
