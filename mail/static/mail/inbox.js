document.addEventListener('DOMContentLoaded', function() {

  const mail_view_div = document.createElement('div');
  mail_view_div.id = 'mail-view';
  mail_view_div.innerHTML = 'WHERE IS IT';
  mail_view_div.style = 'display: block';
  document.querySelector('.container').append(mail_view_div);


  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
});



function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';




  // TRY SENDING EMAIL
  document.querySelector('#compose-form').onsubmit = send_email;
}


function send_email(){
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result)
  })

  load_mailbox('sent');
  return false;
}


// i made it an async function to make the emails appear when redirected
// from archiving or sending emails. Without that the call to API does
// not give back the newest updated email
async function load_mailbox(mailbox) {

  await new Promise(r => setTimeout(r, 100));
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // TRY SHOWING MAILSSS:
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
  
      // display emails!
      emails.forEach(contents => {
        const mail = document.createElement('div');
        if (contents['read'] === true) {
          mail.classList.add('mail', 'read');
        } else {
          mail.classList.add('mail', 'unread');
        }
        
        mail.innerHTML = `<p>From: ${contents['sender']}</p> <h4>${contents['subject']}</h4> <p style="text-align:right;">Date: ${contents['timestamp']}</p>`;
        
        // WHEN YOU CLICK ON THE EMAIL...
        mail.addEventListener('click', function() {
            console.log('This element has been clicked!')
            // GO TO THIS EMAIL PAGE:
            fetch(`/emails/${contents['id']}`)
            .then(response => response.json())
            .then(email => {
                // Print email
                console.log(email);

                // GO
                
                document.querySelector('#emails-view').style.display = 'none';
                document.querySelector('#compose-view').style.display = 'none';
                const this_mail = document.createElement('div');
                this_mail.className = 'this_mail'
                
                let button_text = 'Archive'
                if (email['archived']) {
                  button_text = 'Unarchive'
                }
                
                let button_style = ''
                if (email['sender'] == document.querySelector('h2').innerHTML) {
                  button_style = 'style="display:none;';
                }

                this_mail.innerHTML = `
                <p style="color:gray;">Date: ${email['timestamp']}</p>
                <p>From: ${email['sender']}</p>
                <p>To: ${email['recipients']}</p>
                <br>
                <h4 style="position: relative; margin-top: 7px;">${email['subject']}</h4>
                <div class=this-mail-body>
                  <div style='white-space: pre-wrap;'>${email['body']}</div>
                  <hr>
                  <button class="btn btn-dark" ${button_style} id='replybutton' onclick='reply(${email['id']})'>Reply</button>
                  <button class="btn btn-dark" ${button_style} id='archbutton' onclick='archiving(${email['id']})'>${button_text}</button>
                </div>`;
                
                document.querySelector('#mail-view').innerHTML = '';
                document.querySelector('#mail-view').append(this_mail);
                document.querySelector('#mail-view').style.display = 'block';
            });

            fetch(`/emails/${contents['id']}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
            });

        });
        document.querySelector('#emails-view').append(mail);
      });

  });
};


// function for archiving and unarchiving mails
function archiving(id) {

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      if (email['archived']) {
        fetch(`/emails/${email['id']}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: false
          })
        });
        document.querySelector("#archbutton").innerHTML = "Archive";

      } else {
        fetch(`/emails/${email['id']}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: true
          })
        });
        document.querySelector("#archbutton").innerHTML = "Unarchive";
      }
  });

  load_mailbox('inbox');
}


function reply(id) {

  // manipulate views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail-view').style.display = 'none';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // prepopulate fields
    if (email['subject'].slice(0, 3) == 'Re:') {
      document.querySelector('#compose-subject').value = `${email['subject']}`;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${email['subject']}`;
    }
    document.querySelector('#compose-recipients').value = `${email['sender']}`;
    document.querySelector('#compose-body').value = `\n\n------------------------------------\n    On ${email['timestamp']} ${email['sender']} wrote: \n\n${email['body']}`;
    document.querySelector('#compose-body').selectionEnd=0;
    document.querySelector('#compose-body').focus();
  });

    
    // SEND EMAIL
    document.querySelector('#compose-form').onsubmit = send_email;
}



