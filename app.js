const http = require('http');
const fs = require('fs');
const url = require('url');
const { v4: uuidv4 } = require('uuid');

const hostname = '127.0.0.1';
const port = 3000;

const readBooks = () => {
  return JSON.parse(fs.readFileSync('books.json', 'utf8'));
};

const writeBooks = (books) => {
  fs.writeFileSync('books.json', JSON.stringify(books, null, 2));
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  if (method === 'GET' && path === '/books') {
    const books = readBooks();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(books));

  } else if (method === 'GET' && path.startsWith('/books/')) {
    const id = path.split('/')[2];
    const books = readBooks();
    const book = books.find(b => b.id === id);

    if (book) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(book));
    } else {
      res.statusCode = 404;
      res.end('Ma\'lumot topilmadi');
    }

  } else if (method === 'POST' && path === '/books') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { title, author } = JSON.parse(body);
      const books = readBooks();
      const existingBook = books.find(b => b.title === title);

      if (existingBook) {
        res.statusCode = 400;
        res.end('Bu kitob bazada mavjud');
      } else {
        const newBook = {
          id: uuidv4(),
          title,
          author
        };
        books.push(newBook);
        writeBooks(books);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(newBook));
      }
    });

  } else if (method === 'PUT' && path.startsWith('/books/')) {
    const id = path.split('/')[2];
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { title, author } = JSON.parse(body);
      const books = readBooks();
      const bookIndex = books.findIndex(b => b.id === id);

      if (bookIndex !== -1) {
        books[bookIndex] = { id, title, author };
        writeBooks(books);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(books[bookIndex]));
      } else {
        res.statusCode = 404;
        res.end('Ma\'lumot topilmadi');
      }
    });

  } else if (method === 'DELETE' && path.startsWith('/books/')) {
    const id = path.split('/')[2];
    const books = readBooks();
    const bookIndex = books.findIndex(b => b.id === id);

    if (bookIndex !== -1) {
      books.splice(bookIndex, 1);
      writeBooks(books);
      res.statusCode = 200;
      res.end('Ma\'lumot o\'chirildi');
    } else {
      res.statusCode = 404;
      res.end('Ma\'lumot topilmadi');
    }

  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
