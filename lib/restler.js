var rest = require('restler');
/*
rest.get('https://www.smsmessagesender.com/api/usercredits', {
  headers: {
    authorization: 'Basic '
  }
})
  .on('success', function( data, response ) {
    console.log( 'credits: ', data );
  })
  .on('fail', function( data, response ) {
    console.log( 'fail: ', data );
  })
  .on('error', function( err, response ) {
    console.log( 'error: ', err );
  })  
  .on('complete', function() {
  
  });

    rest.get('https://www.smsmessagesender.com/api/sms/ids', {
      headers: {
        authorization: 'Basic bWF0dG9uZm9vdDoxOGE1ZDQ3OC03NmIxLTRmZWItYjI0NS03YTM5MzM5NWMxN2I='
      }
    })
      .on('success', function( data, response ) {
        console.log( 'list: ', data );
      })
      .on('fail', function( data, response ) {
        console.log( 'fail: ', data );
      })
      .on('error', function( err, response ) {
        console.log( 'error: ', err );
      });
      */
// create a service constructor for very easy API wrappers a la HTTParty...
var SMSClient = rest.service(function( apikey ) {
  this.defaults.headers = {
    authorization: 'Basic ' + apikey
  };
}, {
  baseURL: 'https://www.smsmessagesender.com'
}, {
  credits: function() {
    return this.get( '/api/usercredits' );
  },
  list: function() {
    return this.get( '/api/sms/ids' );
  },
  incoming: function( start, end ) {
    return this.get( '/api/incomingsms?startdate=' + start + '&enddate=' + end );
  }
});

var client = new SMSClient( 'bWF0dG9uZm9vdDoxOGE1ZDQ3OC03NmIxLTRmZWItYjI0NS03YTM5MzM5NWMxN2I=' );

client.credits()
  .on('success', function( data, response ) {
    console.log( 'credits: ', data );
  })
  .on('fail', function( data, response ) {
    console.log( 'fail: ', data );
  })
  .on('error', function( err, response ) {
    console.log( 'error: ', err );
  })  
  .on('complete', function() {
  
  });
  
  

client.list()
  .on('success', function( data, response ) {
    console.log( 'list: ', data );
  })
  .on('fail', function( data, response ) {
    console.log( 'fail: ', data );
  })
  .on('error', function( err, response ) {
    console.log( 'error: ', err );
  });
  
  

client.incoming( '2013-01-01%2000:00:00', '2013-02-01%2000:00:00' )
  .on('success', function( data, response ) {
    console.log( 'incoming: ', data );
  })
  .on('fail', function( data, response ) {
    console.log( 'fail: ', data );
  })
  .on('error', function( err, response ) {
    console.log( 'error: ', err );
  });