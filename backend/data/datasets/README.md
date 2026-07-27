# Raw datasets

Preferred layout:

```text
datasets/
├── fer/
│   └── fer2013.csv
├── ck/
│   └── CK+48/              # or ck/ / CK+/
└── rafdb/
    └── DATASET/
        ├── train/1..7/
        └── test/1..7/
```

The preprocessing script also accepts the same layout inside a
`Facial Expressions/` subfolder, so the folder from the old project can be
moved here without changing its name.
