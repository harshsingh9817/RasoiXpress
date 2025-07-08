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

    // Helper function to check if a user is authenticated (even anonymously).
    // This will be true for the main app's anonymous session and for authenticated riders.
    function isAuthenticated() {
      return request.auth != null;
    }

    // Riders can read their own profile data.
    // Rider profiles are managed by the main application's admin panel, not created here.
    match /riders/{riderId} {
        allow read: if isAuthenticated();
        allow write: if false;
    }

    // Orders are created/updated by the main app and updated by riders.
    // Any authenticated session can read, create, or update orders.
    // The specific business logic is handled in the application code.
    match /orders/{orderId} {
      allow read, write: if isAuthenticated();
      allow delete: if false; // Deletes are restricted for safety.
    }

    // Default deny all access to any other collections.
    match /{path=**} {
      allow read, write: if false;
    }
  }
}
```

4.  Click the **Publish** button.

---

After completing these two steps, the permission errors in your application will be resolved.
