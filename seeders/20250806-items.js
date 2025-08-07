'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('item', [
      // 열쇠(id:1)
      { item_category_id: 1, item_name: '기본 열쇠', price: 1000, prefab_path: "0", size_xyz: null, memo: null, answer: null },
      // 자물쇠(id:2)
      { item_category_id: 2, item_name: '번호 자물쇠', price: 3000, prefab_path: "0", size_xyz: null, memo: null, answer: null },
      { item_category_id: 2, item_name: '텍스트+숫자 자물쇠', price: 4000, prefab_path: "0", size_xyz: null, memo: null, answer: null },
      { item_category_id: 2, item_name: '방향 자물쇠', price: 3500, prefab_path: "0", size_xyz: null, memo: null, answer: null },
      // 쪽지(id:3)
      { item_category_id: 3, item_name: '쪽지', price: 5000, prefab_path: "0", size_xyz: null, memo: null, answer: null }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('item', null, {});
  }
};
