// TODO: so create and validate user here rather than in controller
export const createUser = async (input) => {
  const name = input.name?.trim();
  const email = input.email?.trim();
  const password = input.password?.trim();

  const { image, bio, demo } = input;

  if (!email) {
  }
};
