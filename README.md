# bistro-boss-restaurant-server
 
 * Make the verifyJWT before the verifyAdmin cause this need the server connection
 * app.get('/users', verifyJWT, verifyAdmin, async (req, res) => ) </br>
  after checking user token the check he is verifyAdmin or not . This is checking for to prevent the find of user's info from client site. If he is not admin in client site then take him to the login page 
  * app.get('/carts', verifyJWT, async (req, res) =>) <br>
  This use for to protect the server site from find the other info 

  