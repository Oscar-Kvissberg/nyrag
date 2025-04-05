const { getSql } = require('./app/lib/db');

async function createClubConfig() {
  try {
    const sql = await getSql();
    
    // Check if config already exists
    const existingConfigs = await sql`
      SELECT club_id FROM club_config WHERE club_id = 'rattvik'
    `;
    
    if (existingConfigs.length > 0) {
      console.log('Club config already exists for rattvik');
      return;
    }
    
    // Create new config
    await sql`
      INSERT INTO club_config (
        club_id, 
        config
      ) VALUES (
        'rattvik',
        ${JSON.stringify({
          club_name: 'Rättviks Golfklubb',
          club_description: 'Rättviks Golfklubb är en golfklubb i Rättvik',
          club_rules: 'Standardgolfregler gäller',
          club_context: 'Rättviks Golfklubb är en golfklubb i Rättvik, Sverige. Klubben har en 18-hålsbana och erbjuder golf för både nybörjare och erfarna spelare.'
        })}
      )
    `;
    
    console.log('Club config created successfully for rattvik');
  } catch (error) {
    console.error('Error creating club config:', error);
  }
}

createClubConfig(); 