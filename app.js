//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

async function main() {
  await mongoose.connect("mongodb+srv://root:root@cluster0.oau3jje.mongodb.net/todolistDB")
  console.log("DB connected")
}

main().catch(err => console.log(err))

const itemsSchema = new mongoose.Schema({
  name: String
})
const Item = mongoose.model("Item", itemsSchema)

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

// ?sample data
const sleep = new Item({
  name: "Sleep"
})
const eat = new Item({
  name: "Eat"
})
const work = new Item({
  name: "Work"
})
const defaultData = [sleep, eat, work]

const defaultitems = () => {
  Item.insertMany(defaultData)
    .then(function () {
      console.log("Successfully saved default data to db");
    }).catch(err => console.log(err))
}

app.get("/", function (req, res) {
  Item.find()
    .then(function (items) {
      if (items.length === 0) {
        defaultitems();
      }
      console.log(items);
      res.render("list", { listTitle: "Today", newListItems: items });
    }).catch(err => console.log(err))
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // console.log(listName)
  const newItem = new Item({
    name: itemName
  })
  if (listName === "Today") {
    newItem.save();
    res.redirect("/")
  } else {
    List.findOne({ name: listName }).then(function (found) {
      found.items.push(newItem);
      found.save();
      res.redirect(`/${listName}`)
    }).catch(err => console.log(err))
  }
});

app.post("/delete", function (req, res) {
  // console.log(req.body.delete)
  const itemID = req.body.delete;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndDelete(itemID)
      .then(function () {
        console.log("Successfully deleted" + itemID)
        res.redirect("/")
      }).catch(err => console.log(err))
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemID } } }).then(function (found) {//@deletes items
      // console.log("found: "+found)
      res.redirect(`/${listName}`)
    }).catch(err => console.log(err))
  }
})

app.get("/:listName", function (req, res) {
  const customListName = _.capitalize(req.params.listName)

  List.findOne({ name: customListName })
    .then(function (found) {
      if (!(found)) {
        const newList = new List({
          name: customListName,
          items: defaultData
        })
        newList.save().then(function () { console.log("new list created") });
        res.redirect("/" + customListName)
      } else {
        // console.log("found"+found.items)
        res.render("list", { listTitle: customListName, newListItems: found.items });
      }
    }).catch(err => console.log(err))
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});


// mongodb+srv://root:root@cluster0.oau3jje.mongodb.net/
// shell
// mongosh "mongodb+srv://cluster0.oau3jje.mongodb.net/" --apiVersion 1 --username root