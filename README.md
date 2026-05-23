# Xtreak
#### Video Demo:  https://youtu.be/mx_gTy3m03U
#### Description:
##### What is Xtreak?:

Xtreak is a simple productivity app that helps you track your tasks
and their associated streaks. Each task gets its own calendar where
you can mark Xs to track your progress.

The goal of this app is to help you stay focused, consistent, and
motivated. Xtreak is designed to be simple, fast, and easy to use.

You can start by adding tasks using the + button on the homepage. You can
give each task a title and an optional description.

When you complete a task, open its page and click on the current date
to mark it with an X. You can view both your current streak and longest streak for each
task on the task page and homepage.

##### How it works?:

You can login or register on Xtreak. To register, you'll have to enter your name, username, and password.
Once you're in the homepage, you'll have no tasks initially.

When you're in the login or register page, the title in navbar will be "Xtreak."
But when you log into your account, the navbar title will be changed to "*your name*'s Streaks."
I made this decision so that your homepage should truly feel yours.

BTW, after login, you can press the + floating button to add a new task.
You'll have to enter a title for your task. You can also add a description if you want.

The task will be added as a list item in your homepage. You can see your current and longest streaks
below the title of your task on homepage. You can click on any of your task to see its task page.

A task page will have task title in the navbar, streaks counter with the numbers of current and longest streaks, 
the main calendar, the task description, and lastly the date that task is created on.

You can click on the the task title to edit right away. You can also edit the description and press save button to save it.

The important part is calendar. If you're on smartphone, you can swipe left or right to change the month.
Or alternatively, you can press the left-right buttons next to month name above.

You can see what month it is, the day names, and all the dates on the current month.
The current day will be highlighted in orangered color. I decided to keep the current day indicator simple.

Once you click on a date that is not in the future, a bright red X will be placed there.
By clicking again, you can remove that X.

That is all about the main functionality. But there are some other features I added.

##### Other features:

I added some basic features on auth pages, such as eye icon to show/hide the password, remember me button.
On the navbar, I added a menu where you can see some options such as about page, logout option, profile page, sort option.

On about page, you'll find some basic info about my app. On profile page, you'll find your profile info and you can also edit it.
There is also an option to delete your account permanently on profile page.

Also to sort your list of tasks, you currently have 5 options: sort by date down (oldest first, newest last), date up (the opposite of date down),
name A-Z, name Z-A, and custom. If you select custom, handles will appear on right side of all your tasks. You can hold and drag those handles to
sort your tasks as you want. Your custom preference will be saved.

I added this custom sort option because I thought it's important to let users sort their tasks as they wish.
Because one task can be more important to them despite the task's name or date of creation.

##### My creative choices:

I decided to go with the soft black and orangered theme with soft white color for text.
I chose this theme because I didn't want to hurt user's eyes with pure black or pure white.
And for me, orangered color feels energizing.

Also I gave Xs the bright red color to make it look really good and attractive.

I got the idea for this app from the Seinfeld Strategy AKA "Don't break the chain technique."
It works like this: You pick a task you want to do daily, get a physical calendar and a red marker, then as you complete that task,
you mark a big, bright, red X on that date. If you do the task daily, a chain will be created with those Xs.
Your goal is do complete that task daily and don't break the chain.

By looking at that big, red chain of Xs, you get motivation, and so you stay consistent.

The problem I found with this strategy is that you'll be needing multiple physical calendars if you want to become consistent at multiple tasks.
And that is going to make things messy. That is the reason I made this app.

No need to manage multiple physical calendars, your streaks will be saved forever on my app,
no need to count your current or longest streak manually, also you can mark the dates from anywhere, anytime.

I also added a little pop and draw animation with a soft pop sound when you place an X. The fire icon also has animation.
There is also a ding sound when you break your own longest streak with a pop animation on trophy icon.

I decided to keep things subtle because I wanted my app to be simple not flashy.

##### What the files do?:

app.py:
This is the main Flask application file. It handles routing, user authentication,
database operations, task creation, editing, deleting, streak calculations,
and rendering templates. All the things a backend do.

templates/:
This folder contains all HTML templates used in the application. Currently these templates are:
about.html, index.html, layout.html, login.html, profile.html, register.html, and task.html
I'm using layout.html as the boilerplate code for html files using Jinja.

static/:
This folder contains CSS, JavaScript, sound effects, and icons used by the app.

style.css:
Contains the main styling of the application including the dark theme,
animations, responsive layout, navbar styling, task cards, and calendar design.

script.js:
Handles frontend interactivity such as animations, swipe gestures,
calendar interactions, sound effects, editing tasks, and UI updates.

helpers.py:
Contains helper functions used in the app.py, because I wanted to keep app.py clean.

xtreak.db:
SQLite database file used to store users, tasks, streak data,
custom sorting preferences, and other information.
