export const generateLink = (path) => {
    const isProd = process.env.NODE_ENV === "production";
    const port = process.env.PORT;

    const portPart = !isProd && port ? `:${port}` : "";
    return `${process.env.DOMAIN}${portPart}${path}`;
};