class UserSpaceIdDto  {
    constructor(user_space_id) {
        if (!user_space_id || isNaN(user_space_id)) {
            throw new Error('user_space_id 오류');
        }
        this.user_space_id = Number(user_space_id);
    }
}

module.exports = { UserSpaceIdDto };