'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('item_category', [
      { category_name: '열쇠' },
      { category_name: '자물쇠' },
      { category_name: '쪽지' }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('item_category', null, {});
  }
};
