# How to use your site

Everything is plain text files. Edit them on github.com (press `.` in the repo to open the web editor) or on your laptop, commit, and GitHub rebuilds the site in about a minute.

## Write an essay

1. Make a new file in the `_essays/` folder named `YYYY-MM-DD-short-title.md`, for example `_essays/2026-11-02-why-i-build-hardware.md`. The part after the date becomes the URL: `/essays/why-i-build-hardware/`.
2. Start it with this header:

   ```
   ---
   title: Why I build hardware
   dek: An optional one-line subtitle.
   date: 2026-11-02
   ---
   ```

3. Write underneath in Markdown. `_essays/2026-10-29-example-essay.md` shows every trick: subheadings, quotes, footnotes, images, code.

**Red-pen margin notes.** Put a short aside inside a paragraph like this:

```
The board worked first time.<span class="margin-note">It did not.</span>
```

On a laptop it sits in the margin; on a phone it drops below the line.

**Drafts.** Add `published: false` to the header and the essay stays off the live site until you remove it.

**Images.** Put them in `assets/img/` and write `![description](/assets/img/name.jpg)`.

## Add a book

Open `_data/books.yml` and add an entry:

```
- title: The Design of Everyday Things
  author: Don Norman
  status: read          # reading, read or next
  year: 2026            # when you read it
  pages: 368            # makes the spine the right thickness
  color: "#c44d2f"      # spine colour
  text: dark            # only if the colour is light
  note: One or two lines on why it stuck.
```

The order in the file is the order on the shelf. **The six books in there now are placeholders. Swap them for your own.**

## Update your work

Experience, projects, awards and skills are all in `_data/work.yml`. The first four projects also appear on the home page.

## Settings

`_config.yml` holds your name, description, and links. Add your email there to show it in the footer.
