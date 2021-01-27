//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(
  process.env.DATABASE_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  console.log('I am running bitches')
);


console.log()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model('item', itemsSchema);

const item1 = new Item({
  name: 'homework',
});

const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model('List', listSchema);
app.get('/about', function (req, res) {
  res.render('about');
});

app.get('/', function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Succesfully inserted');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems,
      });
    }
  });
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        console.log('doesnt exist');
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', (req, res) => {
  const itembyID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndDelete(itembyID, (err) => {
      if (!err) {
        console.log('Succesfully removed');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itembyID}}}, (err, foundList) => {
      if (!err){
        res.redirect("/" + listName);
      }
    })
  }
});

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
