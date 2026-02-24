document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.getElementById('cellHideBgBorder');

  checkbox.addEventListener('change', function() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (this.checked) {
        table.classList.add('no-style');
      } else {
        table.classList.remove('no-style');
      }
    });
  });
});
