import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, arrayUnion, increment } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz05n1FzvJTo54VA30UUV8VWBlwKZ7w5I",
  authDomain: "webblog-8922a.firebaseapp.com",
  projectId: "webblog-8922a",
  storageBucket: "webblog-8922a.firebasestorage.app",
  messagingSenderId: "576977340463",
  appId: "1:576977340463:web:d4b1e510d88d012f295eda",
  measurementId: "G-E3WTSKQRLW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const articlesSection = document.getElementById("articles");
const addArticleButton = document.getElementById("addArticle");
const userNameDisplay = document.getElementById("userName");

// Auth State listener
onAuthStateChanged(auth, user => {
  if (user) {
    userNameDisplay.innerText = `Welcome, ${user.displayName}`;
  } else {
    userNameDisplay.innerText = "Please log in to add articles.";
  }
});

// Sign in with Google
document.getElementById("loginButton").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("User logged in:", result.user);
  } catch (error) {
    console.error("Login error:", error.message);
  }
});

// Sign out
document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Logout error:", error.message);
  }
});

// Fetch articles
async function fetchArticles() {
  const querySnapshot = await getDocs(collection(db, "articles"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const article = document.createElement('div');
    article.className = 'article';
    article.innerHTML = `
      <h2>${data.title}</h2>
      <p>${data.content}</p>
      <p>By: ${data.author}</p>
      <p>Likes: ${data.likes} | Comments: ${data.comments.length}</p>
      <button class="like-button" data-id="${doc.id}">👍 Like</button>
      <button class="comment-button" data-id="${doc.id}">💬 Comment</button>
    `;
    articlesSection.appendChild(article);
  });
}

// Add article to Firestore
addArticleButton.addEventListener("click", async () => {
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const author = auth.currentUser ? auth.currentUser.displayName : "Anonymous";
  const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
  const date = new Date();

  if (title && content && author) {
    try {
      // Add new article to Firestore
      await addDoc(collection(db, "articles"), {
        title,
        content,
        author,
        date,
        tags,
        likes: 0,
        comments: []
      });

      // Clear input fields
      document.getElementById('title').value = '';
      document.getElementById('content').value = '';
      document.getElementById('tags').value = '';

      // Fetch updated list of articles
      fetchArticles();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  } else {
    alert('Please fill out all required fields!');
  }
});

// Add like to article
articlesSection.addEventListener("click", async (e) => {
  if (e.target.classList.contains("like-button")) {
    const articleId = e.target.getAttribute("data-id");

    try {
      // Increment the like count of the specific article
      const articleRef = doc(db, "articles", articleId);
      await updateDoc(articleRef, {
        likes: increment(1) // Increment likes by 1
      });

      // Refresh the article list
      fetchArticles();
    } catch (error) {
      console.error("Error updating likes: ", error);
    }
  }
});

// Add comment to article
articlesSection.addEventListener("click", async (e) => {
  if (e.target.classList.contains("comment-button")) {
    const articleId = e.target.getAttribute("data-id");
    const comment = prompt("Enter your comment:");

    if (comment) {
      try {
        // Add the comment to the specific article
        const articleRef = doc(db, "articles", articleId);
        await updateDoc(articleRef, {
          comments: arrayUnion(comment) // Add comment to the comments array
        });

        // Refresh the article list
        fetchArticles();
      } catch (error) {
        console.error("Error adding comment: ", error);
      }
    }
  }
});

// Fetch articles on page load
fetchArticles();
