var Magnetise = require('../lib');

var magnetise = Magnetise.Client( '2f634834-beb9-41ed-9f1d-8c82dca8b2bf' );

magnetise.send( "Console", "+445555889993", "SMS integration - done", "Testing, campaign 2" )
.on( 'success', function( data ) {
  console.info( 'send:', data );
})
.on( 'error', function( err ) {
  console.error( 'error:', err );
});
