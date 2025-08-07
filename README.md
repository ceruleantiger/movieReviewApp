# Movie Review App
A full-stack movie review web application built with Node.js, Express, SQLite, and Handlebars, using API. 
Users can register, log in, search for movies, write reviews, manage their own content, and read reviews written by others. 
Admins have privileges to view all users.

## Features
- User authentication (register, login, logout)
- Users (including admins) must log in to use the app
- Admin-only access to `/admin` to view users and roles
- Search for movie data using an API
- Submit and view reviews for movies
- Persistent data (accounts and reviews) stored in SQLite database
- Frontend rendering with Handlebars

## Run
npm install

node server.js

http://localhost:3000/

## API Key
This app requires an API key, you need to register for one, then open `server.js`, 
replace the line:
```js
const apikey = 'yourapikey'

