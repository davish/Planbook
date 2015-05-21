# Refactor Notes
Eventually, I'm going to rebuild this basically from the ground up with best practices that I've learned over the past two years.
This is a list of things that I'd want to do for that.

- new structure weekly assignments.
    - currently this is just a dictionary that functions like a 2D array, where you can find a box by data[id,Day] (without the comma of course). If you want to get all assignments by a day, that would take O(n) time, with n being number of classes. usually this should be OK, but you'll never know.