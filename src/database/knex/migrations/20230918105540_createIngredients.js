exports.up = (knex) =>
    knex.schema.createTable('ingredients', (table) => {
        table.increments('id');
        table.text('title').notNullLabel;

        table
            .integer('product_id')
            .references('id')
            .inTable('products')
            .onDelete('CASCADE');
        table.text('user_id').references('id').inTable('users');
    });

exports.down = (knex) => knex.schema.dropTable('ingredients');
