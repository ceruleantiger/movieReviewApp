const express = require('express')
const session = require('express-session')
const https = require('https')
const PORT = process.env.PORT || 3000
const path = require('path')
const app = express()
var routes = require('./routes/index')

const apikey = 'yourapikey'

//parse HTML <form> POST data and put it in req.body
app.use(express.urlencoded({ extended: true }))

app.use(session({secret: 'secret', resave: false, saveUninitialized: true}))

app.use(express.static(path.join(__dirname, '/public')))
//app.use(routes.authenticate)

app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  next()
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

function needlogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/')
  }
  req.user = req.session.user
  next()
}

app.get('/search', needlogin, (request, response) => {
    console.log(request.path)
    let movieTitle = request.query.title
    if (!movieTitle) {
        return response.render('results', { error: 'please enter a title' })
    }
    let titleWithPlusSigns = movieTitle.trim().replace(/\s/g, '+')
    console.log('titleWithPlusSigns: ' + titleWithPlusSigns)
    
    const options = {
      "method": "GET",
      "hostname": "api.themoviedb.org",
      "path": `/3/search/movie?api_key=${apikey}&query=${titleWithPlusSigns}`,
      
    }
    //create the actual http request and set up
    //its handlers
    https.request(options, function(apiResponse) {
      let data = ''
      apiResponse.on('data', function(chunk) {
        data += chunk
      })
      apiResponse.on('end', function() {
        response.render('results', { result: JSON.parse(data).results })
      })
    }).end() //important to end the request
             //to actually send the message
})


app.get('/movie/:id', needlogin, (request, response) => {
  let id = request.params.id
  const options = {
    "method": "GET",
    "hostname": "api.themoviedb.org",
    "path": `/3/movie/${id}?api_key=${apikey}`,
    
  }

  //director, starring, cast
  const credits = {
    hostname: 'api.themoviedb.org',
    path: `/3/movie/${id}/credits?api_key=${apikey}`,
    method: 'GET'
  }

  https.request(options, function(apiResponse) {
    let data = ''
    apiResponse.on('data', function(chunk) {
      data += chunk
    })
    apiResponse.on('end', function() {
      let movie = JSON.parse(data)

      https.request(credits, function(creditsRes) {
        let cdata = ''
        creditsRes.on('data', function(chunk) {
          cdata += chunk
        })
        
        creditsRes.on('end', function() {
          let people = JSON.parse(cdata)
          let director = people.crew.find(p => p.job == 'Director')
          let stars = people.cast.slice(0, 3).map(actor => actor.name)  //top 3 stars
        
          let dname = 'Unknown'
          if (director) {
            dname = director.name
          }
          response.render('movieDetails', { title: movie.title, movie, 
            director: dname,
            stars: stars.join(', ')
          })
        })
      }).end()
    })
  }).end()
})


app.get('/', routes.index)
app.get('/my-reviews', needlogin, routes.myreviews)
app.post('/submit-review', needlogin, routes.submitReview)
app.get('/reviews', needlogin, routes.reviewsForMovie)
app.get('/admin', needlogin, routes.admin)
app.post('/register', routes.register)
app.post('/login', routes.login)
app.post('/logout', routes.logout)


app.listen(PORT, err => {
    if (err) console.log(err)
    else {
        console.log(`Server listening on port: ${PORT} CNTL:-C to stop`)
        console.log(`To Test:`)
        console.log('http://localhost:3000/')
        console.log('http://localhost:3000/my-reviews')
        console.log('http://localhost:3000/search?title=inception')
        console.log('http://localhost:3000/movie/27205')
        console.log('http://localhost:3000/reviews?movie_id=27205&movie_title=inception')
        console.log('http://localhost:3000/admin')
        
    }
})

