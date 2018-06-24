## steemblr backend
Backend scripts based on esync and cloud functions.
### Setup
```
git clone https://github.com/snwolak/steemblr_backend.git
cd steemblr_backend
npm install
npm start
```
### Setup for firebase functions
```
firebase init
paste firebase folder from this repo
firebase serve
```
### ENV

To launch firebase functions you need firebase admin api creditentials and save them as serviceAccount.json file in functions folder.
