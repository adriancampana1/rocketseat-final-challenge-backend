exports.up = (knex) =>
    knex.schema.createTable('products', (table) => {
        table.increments('id');
        table.text('title');
        table.text('description');
        table.text('price');
        table.text('category');
        table.text('image');
        table.text('user_id').references('id').inTable('users');
        table.timestamp('created_at').default(knex.fn.now());
    });

exports.down = (knex) => knex.schema.dropTable('products');
