class InsertItemsDto {
    constructor(data) {
        const { items } = data;
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('items 배열이 필요합니다.');
        }
        this.items = items;
    }
}

module.exports = { InsertItemsDto };