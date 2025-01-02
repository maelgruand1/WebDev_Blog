import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, getDocs, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCz05n1FzvJTo54VA30UUV8VWBlwKZ7w5I",
    authDomain: "webblog-8922a.firebaseapp.com",
    projectId: "webblog-8922a",
    storageBucket: "webblog-8922a.firebasestorage.app",
    messagingSenderId: "576977340463",
    appId: "1:576977340463:web:d4b1e510d88d012f295eda",
    measurementId: "G-E3WTSKQRLW"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Élément DOM
const articlesSection = document.getElementById('articles');
const addArticleButton = document.getElementById('addArticle');
const loginButton = document.getElementById('loginButton');

// Fonction d'authentification
loginButton.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("User signed in: ", user.displayName);
            alert('Welcome ' + user.displayName);
            document.querySelector('.auth').style.display = 'none'; // Cacher le bouton de connexion
        })
        .catch((error) => {
            console.error(error);
        });
});

// Suivi de l'état de l'utilisateur
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user.displayName);
    } else {
        console.log('No user is logged in');
    }
});

// Fonction pour afficher les articles
async function fetchArticles() {
    const querySnapshot = await getDocs(collection(db, "articles"));
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const articleId = doc.id;
        
        const article = document.createElement('div');
        article.className = 'article';
        article.innerHTML = `
            <h2>${data.title}</h2>
            <p>${data.content}</p>
            <p>Author: ${data.author}</p>
            <div>
                <button class="likeButton">👍 Like</button>
                <span class="likesCount">Likes: ${data.likes}</span>
            </div>
            <div>
                <textarea class="commentInput" placeholder="Add a comment..."></textarea>
                <button class="addCommentButton">Add Comment</button>
                <div class="commentsList"></div>
            </div>
        `;
        
        articlesSection.appendChild(article);

        // Affichage des commentaires
        const commentsList = article.querySelector('.commentsList');
        data.comments.forEach((comment) => {
            const commentElement = document.createElement('div');
            commentElement.textContent = `${comment.author}: ${comment.content}`;
            commentsList.appendChild(commentElement);
        });

        // Logique des likes
        const likeButton = article.querySelector('.likeButton');
        const likesCount = article.querySelector('.likesCount');

        likeButton.addEventListener('click', async () => {
            data.likes += 1;  // Augmenter le nombre de likes

            likesCount.textContent = `Likes: ${data.likes}`;

            // Mettre à jour Firestore
            await updateDoc(doc(db, "articles", articleId), {
                likes: data.likes
            });
        });

        // Logique des commentaires
        const addCommentButton = article.querySelector('.addCommentButton');
        const commentInput = article.querySelector('.commentInput');

        addCommentButton.addEventListener('click', async () => {
            const comment = commentInput.value.trim();
            if (comment) {
                const user = auth.currentUser;
                const userName = user ? user.displayName : 'Anonymous';

                // Ajouter un commentaire dans Firestore
                await updateDoc(doc(db, "articles", articleId), {
                    comments: arrayUnion({
                        author: userName,
                        content: comment,
                        date: new Date()
                    })
                });

                // Ajouter le commentaire dans l'interface
                const newComment = document.createElement('div');
                newComment.textContent = `${userName}: ${comment}`;
                commentsList.appendChild(newComment);

                // Effacer le champ de texte
                commentInput.value = '';
            }
        });
    });
}

// Fonction pour ajouter un nouvel article
addArticleButton.addEventListener('click', async () => {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
    const user = auth.currentUser;
    const author = user ? user.displayName : 'Anonymous';
    const date = new Date();

    if (title && content) {
        try {
            // Ajouter l'article à Firestore
            await addDoc(collection(db, "articles"), {
                title,
                content,
                author,
                date,
                tags,
                likes: 0,
                comments: []
            });

            // Ajouter l'article dans l'interface
            const article = document.createElement('div');
            article.className = 'article';
            article.innerHTML = `
                <h2>${title}</h2>
                <p>${content}</p>
                <p>Author: ${author}</p>
                <div>
                    <button class="likeButton">👍 Like</button>
                    <span class="likesCount">Likes: 0</span>
                </div>
                <div>
                    <textarea class="commentInput" placeholder="Add a comment..."></textarea>
                    <button class="addCommentButton">Add Comment</button>
                    <div class="commentsList"></div>
                </div>
            `;
            articlesSection.appendChild(article);

            // Vider les champs
            document.getElementById('title').value = '';
            document.getElementById('content').value = '';
            document.getElementById('tags').value = '';
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    } else {
        alert('Please fill out all required fields!');
    }
});

// Charger les articles existants
fetchArticles();
