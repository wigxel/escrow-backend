function extractPublicId(url) {
  const regex = /\/v\d+\/(.+?)\./;
  const match = url.match(regex);
  return match ? match[1] : null;
}

const url = "https://res.cloudinary.com/ddxze5cih/image/upload/v1739796202/profile/ctcwg5ko5qivukud7auk.jpg";
const publicId = extractPublicId(url);
console.log(publicId);