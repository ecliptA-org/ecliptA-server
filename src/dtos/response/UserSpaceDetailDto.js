class UserSpaceDetailDto {
  constructor({ user_space_id, space_name, memo }) {
    this.result = 'success';
    this.user_space_id = user_space_id;
    this.space_name = space_name;
    this.memo = memo;
  }
}

module.exports = { UserSpaceDetailDto };
